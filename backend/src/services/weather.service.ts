import { WeatherData } from '../types/weather';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface IWeatherProvider {
  getCurrentWeather(lat: number, lon: number, siteId?: string): Promise<WeatherData>;
  getForecast(lat: number, lon: number): Promise<any>;
}

interface CachedCoordWeather {
  data: WeatherData;
  expiresAt: number;
}

const coordCache = new Map<string, CachedCoordWeather>();

export class OpenMeteoProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lon: number, siteId?: string): Promise<WeatherData> {
    const coordKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const now = Date.now();

    // 1. Check in-memory coordinate cache (5-min TTL)
    const memCached = coordCache.get(coordKey);
    if (memCached && memCached.expiresAt > now) {
      return memCached.data;
    }

    // 2. If siteId provided, check DB cache
    let dbCached: any = null;
    if (siteId) {
      const { data } = await supabase
        .from('weather_readings')
        .select('*')
        .eq('site_id', siteId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      dbCached = data;

      if (dbCached && new Date(dbCached.expires_at) > new Date()) {
        coordCache.set(coordKey, {
          data: dbCached as WeatherData,
          expiresAt: new Date(dbCached.expires_at).getTime(),
        });
        return dbCached as WeatherData;
      }
    }

    // 3. Fetch fresh weather from Open-Meteo
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure&hourly=uv_index`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API failed: ${response.statusText}`);
      const data = await response.json();

      const weatherData: WeatherData = {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        uv_index: data.hourly?.uv_index?.[0] || 0,
        wind_speed: data.current.wind_speed_10m,
        pressure: data.current.surface_pressure,
        source: 'open-meteo',
        timestamp: new Date().toISOString(),
        confidence: 'high',
        is_stale: false,
      };

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Save to memory cache
      coordCache.set(coordKey, {
        data: weatherData,
        expiresAt: expiresAt.getTime(),
      });

      // If siteId provided, also save to DB table
      if (siteId) {
        await supabase.from('weather_readings').insert({
          site_id: siteId,
          ...weatherData,
          expires_at: expiresAt.toISOString(),
        });
      }

      return weatherData;
    } catch (error) {
      logger.error('Failed to fetch weather, attempting stale fallback', { error });

      // 4. Fallback to stale memory cache or DB cache
      if (memCached) {
        return { ...memCached.data, confidence: 'low', is_stale: true } as WeatherData;
      }
      if (dbCached) {
        return { ...dbCached, confidence: 'low', is_stale: true } as WeatherData;
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