export interface WeatherData {
  temperature: number;
  humidity: number;
  uv_index: number;
  wind_speed: number;
  pressure?: number;
  condition?: string;
  source: 'open-meteo' | 'cache' | 'simulated';
  timestamp: string;
  confidence?: 'high' | 'medium' | 'low';
  is_stale?: boolean;
  isStale?: boolean;
}