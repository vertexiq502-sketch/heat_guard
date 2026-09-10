import { Router } from 'express';
import { supabase } from '../config/supabase';
export const auditRoutes = Router();
auditRoutes.get('/:siteId', async (req, res) => {
  const { data } = await supabase.from('compliance_logs').select('*').eq('site_id', req.params.siteId);
  res.json(data);
});