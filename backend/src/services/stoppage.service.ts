import { weatherService } from './weather.service';

export class StoppageService {
  async getWorkWindows(lat: number, lon: number) {
    // Simplified logic
    return {
      safe: "6:30 AM - 10:30 AM",
      stop: "12:00 PM - 3:30 PM",
      caution: "10:30 AM - 12:00 PM, 3:30 PM - 5:00 PM"
    };
  }
}
export const stoppageService = new StoppageService();