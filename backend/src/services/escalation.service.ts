import { supabase } from '../config/supabase';

export class EscalationService {
  async escalateAlert(alertId: string, level: number, siteId: string, workerId: string) {
    const { data, error } = await supabase.from('escalation_events').insert({
      alert_id: alertId,
      site_id: siteId,
      worker_id: workerId,
      level,
      triggered_by: 'auto'
    }).select().single();
    if (error) throw error;
    return data;
  }
}
export const escalationService = new EscalationService();