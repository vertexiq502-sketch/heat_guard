import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { riskService } from '../services/risk.service';
import { weatherService } from '../services/weather.service';
export const riskRoutes = Router();
riskRoutes.post('/calculate', authenticate, async (req: any, res) => {
  try {
    const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.body.siteId);
    const risk = await riskService.calculateRisk(req.user, req.body.siteId, weather);
    res.json(risk);
  } catch(e: any) { res.status(500).json({error: e.message}); }
});