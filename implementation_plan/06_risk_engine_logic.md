# 06. Risk Engine Logic

This document details the deterministic rule engine for calculating the Adjusted Heat Index and assigning Risk Levels. This logic lives in the Node.js Backend (`backend/src/services/RiskEngine.ts`).

## 1. Core Variables
- **$T$**: Temperature in °C.
- **$H$**: Relative Humidity in %.
- **$HI_{base}$**: Base Heat Index calculated using the NOAA formula (converted to °C).

## 2. Base Heat Index Calculation (Pseudocode)
```typescript
function calculateBaseHeatIndex(tempC: number, humidity: number): number {
    // Convert to Fahrenheit for NOAA formula
    const tempF = (tempC * 9/5) + 32;
    
    // Simple formula if temp < 80F
    let hiF = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (humidity * 0.094));
    
    // Full Rothfusz regression if temp >= 80F
    if (hiF >= 80) {
        hiF = -42.379 + 2.04901523*tempF + 10.14333127*humidity - .22475541*tempF*humidity - .00683783*tempF*tempF - .05481717*humidity*humidity + .00122874*tempF*tempF*humidity + .00085282*tempF*humidity*humidity - .00000199*tempF*tempF*humidity*humidity;
        
        // Adjustments
        if (humidity < 13 && tempF >= 80 && tempF <= 112) {
            hiF -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
        } else if (humidity > 85 && tempF >= 80 && tempF <= 87) {
            hiF += ((humidity - 85) / 10) * ((87 - tempF) / 5);
        }
    }
    
    // Convert back to Celsius
    return (hiF - 32) * 5/9;
}
```

## 3. Exposure & Profile Adjustments
Adjustments are fetched from `threshold_configurations` based on `worker_type` (e.g., construction vs farm).

```typescript
function calculateAdjustedHeatIndex(
    baseHI: number, 
    cloudCoverPercent: number, 
    config: ThresholdConfig
): number {
    let adjustedHI = baseHI;

    // 1. Environmental Exposure Adjustment
    // Full sun (low clouds) adds up to 2°C, full shade reduces by 1°C
    if (cloudCoverPercent < 30) {
        adjustedHI += 2.0; // Direct sunlight
    } else if (cloudCoverPercent > 80) {
        adjustedHI -= 1.0; // Overcast/Shade
    }

    // 2. Multipliers and Profile Adjustments from DB
    adjustedHI = adjustedHI * config.exposure_multiplier;
    adjustedHI += config.intensity_adjustment;
    adjustedHI += config.clothing_adjustment;

    return adjustedHI;
}
```

## 4. Risk Level Evaluation
Assign a color-coded risk level based on the DB thresholds.

```typescript
function determineRiskLevel(adjustedHI: number, config: ThresholdConfig): RiskLevel {
    if (adjustedHI >= config.red_threshold) return 'red';       // Extreme Danger
    if (adjustedHI >= config.orange_threshold) return 'orange'; // Danger
    if (adjustedHI >= config.yellow_threshold) return 'yellow'; // Extreme Caution
    return 'green';                                             // Caution / Normal
}
```

## 5. Confidence Score Calculation
A score out of 100 representing data reliability.

```typescript
function calculateConfidenceScore(
    readingTime: Date, 
    hasUVData: boolean, 
    distanceKm: number = 5 // Default assumption for MVP
): number {
    let score = 100;
    
    // Age of reading (lose 5 points per hour old)
    const hoursOld = (Date.now() - readingTime.getTime()) / (1000 * 60 * 60);
    score -= (hoursOld * 5);
    
    // Station distance (lose 2 points per km)
    score -= (distanceKm * 2);
    
    // Missing UV data
    if (!hasUVData) score -= 10;
    
    return Math.max(0, Math.min(100, score)); // Clamp between 0 and 100
}
```

## 6. Execution Flow
1. Fetch `weather_readings` for a Site.
2. Fetch `worker_assignments` for that Site.
3. For each Worker, fetch their `worker_type` config from `threshold_configurations`.
4. Run calculations.
5. If `RiskLevel` > Green OR Level changed from previous assessment -> Insert into `alerts` table.
6. Insert result into `risk_assessments`.
