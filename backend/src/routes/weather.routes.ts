import { Router } from 'express';
import { weatherService } from '../services/weather.service';
export const weatherRoutes = Router();
// GET /api/v1/weather/current?latitude=...&longitude=...
weatherRoutes.get('/current', async (req, res) => {
  try {
    const lat = parseFloat(req.query.latitude as string);
    const lon = parseFloat(req.query.longitude as string);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) required.',
      });
    }

    const weather = await weatherService.getCurrentWeather(lat, lon);
    res.json(weather);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

weatherRoutes.get('/:siteId', async (req, res) => {
  const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.params.siteId);
  res.json(weather);
});