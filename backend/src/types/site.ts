export type SiteType = 'construction' | 'farm' | 'delivery';
export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface Site {
  id: string;
  name: string;
  location: any;
  address?: string;
  district?: string;
  site_type: SiteType;
  default_exposure: string;
  risk_level: RiskLevel;
  last_risk_update?: string;
  is_active: boolean;
}