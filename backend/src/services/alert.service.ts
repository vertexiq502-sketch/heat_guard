import { supabase } from '../config/supabase';
import { Alert } from '../types/alert';

export class AlertService {
  async createAlert(alertData: Partial<Alert>) {
    // Check cooldowns omitted for brevity
    const { data, error } = await supabase.from('alerts').insert({
      ...alertData,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select().single();
    
    if (error) throw error;
    return data;
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const { data, error } = await supabase.from('alerts').update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString()
    }).eq('id', alertId).eq('worker_id', userId).select().single();
    if (error) throw error;
    return data;
  }
}
export const alertService = new AlertService();