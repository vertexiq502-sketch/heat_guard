import { apiClient } from './client';

export interface LocationRiskResponse {
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    wind_speed: number;
    uvIndex: number;
    uv_index: number;
    pressure?: number;
    source: string;
    isStale: boolean;
    confidence: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  risk: {
    score: number;
    category: string;
    confidence: string;
    explanation: string;
    effective_temp: number;
    isStale: boolean;
  };
  recommendations: Array<{
    workStatus?: string;
    restInstruction?: string;
    hydrationInstruction?: string;
    additionalGuidance?: string;
    wellnessTips?: string[];
  }>;
  recommendation?: {
    workStatus?: string;
    restInstruction?: string;
    hydrationInstruction?: string;
    additionalGuidance?: string;
    wellnessTips?: string[];
  };
  fetchedAt: string;
}

export const weatherRiskApi = {
  async getLiveWeather(latitude: number, longitude: number) {
    const res = await apiClient.get('/weather/current', {
      params: { latitude, longitude },
    });
    return res.data;
  },

  async getPersonalizedRiskByLocation(
    latitude: number,
    longitude: number
  ): Promise<LocationRiskResponse> {
    const res = await apiClient.post('/risk/location', {
      latitude,
      longitude,
    });
    return res.data;
  },
};
