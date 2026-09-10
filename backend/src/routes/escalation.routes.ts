import { Router } from 'express';
import { escalationService } from '../services/escalation.service';
export const escalationRoutes = Router();
escalationRoutes.post('/', async (req, res) => {
  const result = await escalationService.escalateAlert(req.body.alertId, req.body.level, req.body.siteId, req.body.workerId);
  res.json(result);
});