import { WeatherData } from '../types/weather';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface IWeatherProvider {
  getCurrentWeather(lat: number, lon: number, siteId: string): Promise<WeatherData>;
  getForecast(lat: number, lon: number): Promise<any>;
}

export class OpenMeteoProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lon: number, siteId: string): Promise<WeatherData> {
    // 1. Try to get fresh cache
    const { data: cached } = await supabase
      .from('weather_readings')
      .select('*')
      .eq('site_id', siteId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached as WeatherData;
    }

    // 2. Try to fetch from Open-Meteo
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure&hourly=uv_index`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API failed: ${response.statusText}`);
      const data = await response.json();
      
      const weatherData: WeatherData = {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        uv_index: data.hourly?.uv_index?.[0] || 0, // Safely access
        wind_speed: data.current.wind_speed_10m,
        pressure: data.current.surface_pressure,
        source: 'open-meteo',
        timestamp: new Date().toISOString()
      };

      // Save to cache
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      await supabase.from('weather_readings').insert({
        site_id: siteId,
        ...weatherData,
        confidence: 'high',
        expires_at: expiresAt.toISOString()
      });

      return weatherData;
    } catch (error) {
      logger.error('Failed to fetch weather, attempting stale fallback', { error });
      // 3. Fallback to stale cache if available
      if (cached) {
        return { ...cached, confidence: 'low' } as WeatherData;
      }
      throw new Error('Weather data unavailable and no cache exists.');
    }
  }

  async getForecast(lat: number, lon: number): Promise<any> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m`;
    const response = await fetch(url);
    return await response.json();
  }
}

export const weatherService = new OpenMeteoProvider();