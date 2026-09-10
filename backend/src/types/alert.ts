export type AlertType = 'risk_update' | 'caution' | 'high_risk' | 'danger' | 'escalation';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'actioned';

export interface Alert {
  id?: string;
  worker_id: string;
  site_id: string;
  risk_assessment_id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  escalation_level: number;
}