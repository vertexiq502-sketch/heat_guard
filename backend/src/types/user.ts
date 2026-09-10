export type Role = 'worker' | 'supervisor' | 'authority';
export type Language = 'en' | 'te' | 'hi';
export type WorkerType = 'construction' | 'delivery' | 'farm';
export type Intensity = 'light' | 'moderate' | 'heavy';
export type Exposure = 'fullSun' | 'partialShade' | 'shade';
export type Duration = 'short' | 'moderate' | 'prolonged';
export type Clothing = 'normal' | 'moderatePPE' | 'heavyPPE';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  language: Language;
  name?: string;
  worker_type?: WorkerType;
  intensity?: Intensity;
  exposure?: Exposure;
  duration?: Duration;
  clothing?: Clothing;
  last_location?: { lat: number; lon: number };
}