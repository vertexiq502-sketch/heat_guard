import { supabase } from '../config/supabase';

export class ComplianceService {
  async logEvent(siteId: string, workerId: string, eventType: string, riskLevel: string, details: any) {
    await supabase.from('compliance_logs').insert({
      site_id: siteId,
      worker_id: workerId,
      event_type: eventType,
      risk_level: riskLevel,
      details,
      event_time: new Date().toISOString()
    });
  }
}
export const complianceService = new ComplianceService();