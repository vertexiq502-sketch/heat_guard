import { Router } from 'express';
import { weatherService } from '../services/weather.service';
export const weatherRoutes = Router();
weatherRoutes.get('/:siteId', async (req, res) => {
  const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.params.siteId);
  res.json(weather);
});