import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { alertService } from '../services/alert.service';
export const alertRoutes = Router();
alertRoutes.post('/:id/acknowledge', authenticate, async (req: any, res) => {
  const result = await alertService.acknowledgeAlert(req.params.id, req.user.id);
  res.json(result);
});