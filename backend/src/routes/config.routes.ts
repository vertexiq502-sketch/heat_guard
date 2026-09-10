import { Router } from 'express';
import { supabase } from '../config/supabase';
export const configRoutes = Router();
configRoutes.get('/thresholds', async (req, res) => {
  const { data } = await supabase.from('threshold_configurations').select('*');
  res.json(data);
});