import { RiskLevel } from './site';

export interface RiskAssessment {
  id?: string;
  worker_id: string;
  site_id: string;
  weather_reading_id?: string;
  effective_temp: number;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: string;
  explanation: string;
  recommendation: Recommendation;
  timestamp?: string;
}

export interface Recommendation {
  workStatus: string;
  restInstruction: string;
  hydrationInstruction: string;
  additionalGuidance: string;
}