# Validation Summary & Methodology

## Component Validation

| Component | Source | Status |
|-----------|--------|--------|
| **NOAA Heat Index Formula** | NOAA Technical Report | ✅ Validated |
| **Exposure Coefficients** | ACGIH WBGT Guidance | ✅ Adapted (MVP) |
| **Work-Intensity Adjustments** | NIOSH/OSHA | ✅ Validated |
| **Risk Thresholds** | Telangana HAP-2026 | ✅ Adapted (MVP) |
| **Worker-Type Profiles** | IEEC/Berkeley EHI-N | ✅ Adapted (MVP) |

## Assumptions & Approximations

1. **Weather Data Proxy:** We use Open-Meteo's standard forecasting API as a proxy for hyper-local microclimate data. In a production environment, this would be supplemented by on-site IoT sensors.
2. **Clothing Adjustment:** Standardized into three tiers (Normal, Moderate PPE, Heavy PPE) based on OSHA guidelines, adding a flat +1°C to +3°C modifier.
3. **Solar Load Approximation:** We approximate solar radiation load based on the user's self-reported exposure setting (Full Sun, Partial Shade, Shade) rather than calculating direct solar irradiance.
4. **Acclimatization:** For this MVP, we assume all workers are fully acclimatized. Unacclimatized workers would require stricter thresholds (typically -2°C on all limits).

## Confidence Scoring Methodology

Our risk engine outputs a confidence score (High/Medium/Low) based on data freshness:
- **High:** Weather data is < 15 minutes old, worker profile updated today.
- **Medium:** Weather data is 15-60 minutes old, or worker profile > 1 day old.
- **Low:** Weather data is > 60 minutes old (stale), or API failure triggered fallback cache.
