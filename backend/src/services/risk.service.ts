import { WeatherData } from '../types/weather';
import { User } from '../types/user';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../utils/helpers';
import { supabase } from '../config/supabase';
import { DEFAULT_THRESHOLDS } from '../config/constants';
import { RecommendationService } from './recommendation.service';

export class RiskService {
  async calculateRisk(user: User, siteId: string, weather: WeatherData) {
    let t = celsiusToFahrenheit(weather.temperature);
    let rh = weather.humidity;
    
    // NOAA Heat Index
    let hi = -42.379 + 2.04901523*t + 10.14333127*rh - 0.22475541*t*rh - 0.00683783*t*t - 0.05481717*rh*rh + 0.00122874*t*t*rh + 0.00085282*t*rh*rh - 0.00000199*t*t*rh*rh;
    let effectiveTemp = fahrenheitToCelsius(hi);

    // Adjustments
    if (user.exposure === 'fullSun') effectiveTemp += 2;
    if (user.exposure === 'partialShade') effectiveTemp += 0.5;
    if (user.exposure === 'shade') effectiveTemp -= 1;

    if (weather.uv_index > 8) effectiveTemp += 1.5;
    else if (weather.uv_index > 6) effectiveTemp += 1.0;
    else if (weather.uv_index > 3) effectiveTemp += 0.5;

    if (user.intensity === 'moderate') effectiveTemp += 2;
    if (user.intensity === 'heavy') effectiveTemp += 4;

    if (user.duration === 'short') effectiveTemp -= 0.5;
    if (user.duration === 'prolonged') effectiveTemp += 1.5;

    if (user.clothing === 'moderatePPE') effectiveTemp += 2;
    if (user.clothing === 'heavyPPE') effectiveTemp += 4;

    // Get thresholds
    const { data: config } = await supabase.from('threshold_configurations').select('*').eq('config_key', 'telangana_hap_2026').single();
    const thresholds = config ? config.thresholds[user.worker_type || 'construction'] : DEFAULT_THRESHOLDS[user.worker_type || 'construction'];

    let riskLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';
    if (effectiveTemp >= thresholds.red) riskLevel = 'red';
    else if (effectiveTemp >= thresholds.orange) riskLevel = 'orange';
    else if (effectiveTemp >= thresholds.yellow) riskLevel = 'yellow';

    const recommendation = RecommendationService.getRecommendation(riskLevel, user.worker_type || 'construction');

    const assessment = {
      worker_id: user.id,
      site_id: siteId,
      effective_temp: effectiveTemp,
      risk_level: riskLevel,
      risk_score: effectiveTemp,
      confidence: 'high',
      explanation: `Base HI: ${fahrenheitToCelsius(hi).toFixed(1)}°C, Adjustments applied for ${user.exposure}, ${user.intensity} intensity, ${user.clothing} clothing.`,
      recommendation,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase.from('risk_assessments').insert(assessment).select().single();
    if (error) {
      console.warn('RiskService: Could not persist assessment, falling back to in-memory result:', error.message);
    }
    return data || assessment;
  }
}

export const riskService = new RiskService();