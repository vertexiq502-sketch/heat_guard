import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { riskService } from '../services/risk.service';
import { weatherService } from '../services/weather.service';
import { supabase } from '../config/supabase';

export const riskRoutes = Router();

riskRoutes.post('/calculate', authenticate, async (req: any, res) => {
  try {
    const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.body.siteId);
    const risk = await riskService.calculateRisk(req.user, req.body.siteId, weather);
    res.json(risk);
  } catch(e: any) { res.status(500).json({error: e.message}); }
});

// POST /api/v1/risk/location
// Accepts { latitude, longitude } and computes live personalized risk for the authenticated worker
riskRoutes.post('/location', authenticate, async (req: any, res) => {
  try {
    const lat = parseFloat(req.body.latitude);
    const lon = parseFloat(req.body.longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) required.',
      });
    }

    const user = req.user;

    // Check if worker has an active assigned site
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('site_id')
      .eq('worker_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const siteId = assignment?.site_id || null;

    // Fetch live weather from Open-Meteo for worker's exact coordinates
    const weather = await weatherService.getCurrentWeather(lat, lon, siteId || undefined);

    // Calculate personalized risk via existing risk engine
    const risk = await riskService.calculateRisk(user, siteId as any, weather);

    res.json({
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.wind_speed,
        wind_speed: weather.wind_speed,
        uvIndex: weather.uv_index,
        uv_index: weather.uv_index,
        pressure: weather.pressure,
        source: weather.source,
        isStale: weather.is_stale || false,
        confidence: weather.confidence || 'high',
      },
      location: {
        latitude: lat,
        longitude: lon,
      },
      risk: {
        score: risk?.risk_score ?? risk?.effective_temp ?? 0,
        risk_score: risk?.risk_score ?? risk?.effective_temp ?? 0,
        category: risk?.risk_level || 'green',
        risk_level: risk?.risk_level || 'green',
        confidence: risk?.confidence || 'high',
        explanation: risk?.explanation || 'Standard calculations applied.',
        effective_temp: risk?.effective_temp ?? 0,
        isStale: weather.is_stale || false,
      },
      recommendations: risk?.recommendation ? [risk.recommendation] : [],
      recommendation: risk?.recommendation,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});