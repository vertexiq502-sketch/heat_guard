const fs = require('fs');
const path = require('path');

const dirs = [
  'src/config',
  'src/services',
  'src/middleware',
  'src/routes',
  'src/validators',
  'src/types',
  'src/jobs',
  'src/utils'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

const files = {
  // Types
  'src/types/user.ts': `
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
`,
  'src/types/site.ts': `
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
`,
  'src/types/weather.ts': `
export interface WeatherData {
  temperature: number;
  humidity: number;
  uv_index: number;
  wind_speed: number;
  pressure?: number;
  condition?: string;
  source: 'open-meteo' | 'cache' | 'simulated';
  timestamp: string;
}
`,
  'src/types/risk.ts': `
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
`,
  'src/types/alert.ts': `
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
`,
  'src/types/api.ts': `
import { Request } from 'express';
import { User } from './user';

export interface AuthRequest extends Request {
  user?: User;
}
`,

  // Config
  'src/config/index.ts': `
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || ''
};
`,
  'src/config/constants.ts': `
export const DEFAULT_THRESHOLDS = {
  construction: { yellow: 30, orange: 35, red: 38 },
  delivery: { yellow: 32, orange: 37, red: 40 },
  farm: { yellow: 30, orange: 35, red: 38 }
};
`,
  'src/config/supabase.ts': `
import { createClient } from '@supabase/supabase-js';
import { config } from './index';

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);
`,

  // Utils
  'src/utils/logger.ts': `
export const logger = {
  info: (msg: string, ...args: any[]) => console.log(\`[INFO] \${msg}\`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(\`[WARN] \${msg}\`, ...args),
  error: (msg: string, ...args: any[]) => console.error(\`[ERROR] \${msg}\`, ...args),
};
`,
  'src/utils/helpers.ts': `
export const fahrenheitToCelsius = (f: number) => (f - 32) * 5 / 9;
export const celsiusToFahrenheit = (c: number) => (c * 9 / 5) + 32;
`,

  // Services
  'src/services/weather.service.ts': `
import { WeatherData } from '../types/weather';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface IWeatherProvider {
  getCurrentWeather(lat: number, lon: number, siteId: string): Promise<WeatherData>;
  getForecast(lat: number, lon: number): Promise<any>;
}

export class OpenMeteoProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lon: number, siteId: string): Promise<WeatherData> {
    // Check cache first (TTL 5 mins)
    const { data: cached } = await supabase
      .from('weather_readings')
      .select('*')
      .eq('site_id', siteId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached as WeatherData;
    }

    // Fetch from Open-Meteo
    const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure&hourly=uv_index\`;
    const response = await fetch(url);
    const data = await response.json();
    
    const weatherData: WeatherData = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      uv_index: data.hourly.uv_index[0] || 0, // Simplified
      wind_speed: data.current.wind_speed_10m,
      pressure: data.current.surface_pressure,
      source: 'open-meteo',
      timestamp: new Date().toISOString()
    };

    // Save to cache
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await supabase.from('weather_readings').insert({
      site_id: siteId,
      ...weatherData,
      confidence: 'high',
      expires_at: expiresAt.toISOString()
    });

    return weatherData;
  }

  async getForecast(lat: number, lon: number): Promise<any> {
    const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&hourly=temperature_2m,relative_humidity_2m\`;
    const response = await fetch(url);
    return await response.json();
  }
}

export const weatherService = new OpenMeteoProvider();
`,
  'src/services/risk.service.ts': `
import { WeatherData } from '../types/weather';
import { User } from '../types/user';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../utils/helpers';
import { supabase } from '../config/supabase';
import { DEFAULT_THRESHOLDS } from '../config/constants';
import { RecommendationService } from './recommendation.service';

export class RiskService {
  async calculateRisk(user: User, siteId: string, weather: WeatherData) {
    let t = celsiusToFahrenheit(weather.temperature);
    let rh = weather.humidity;
    
    // NOAA Heat Index
    let hi = -42.379 + 2.04901523*t + 10.14333127*rh - 0.22475541*t*rh - 0.00683783*t*t - 0.05481717*rh*rh + 0.00122874*t*t*rh + 0.00085282*t*rh*rh - 0.00000199*t*t*rh*rh;
    let effectiveTemp = fahrenheitToCelsius(hi);

    // Adjustments
    if (user.exposure === 'fullSun') effectiveTemp += 2;
    if (user.exposure === 'partialShade') effectiveTemp += 0.5;
    if (user.exposure === 'shade') effectiveTemp -= 1;

    if (weather.uv_index > 8) effectiveTemp += 1.5;
    else if (weather.uv_index > 6) effectiveTemp += 1.0;
    else if (weather.uv_index > 3) effectiveTemp += 0.5;

    if (user.intensity === 'moderate') effectiveTemp += 2;
    if (user.intensity === 'heavy') effectiveTemp += 4;

    if (user.duration === 'short') effectiveTemp -= 0.5;
    if (user.duration === 'prolonged') effectiveTemp += 1.5;

    if (user.clothing === 'moderatePPE') effectiveTemp += 2;
    if (user.clothing === 'heavyPPE') effectiveTemp += 4;

    // Get thresholds
    const { data: config } = await supabase.from('threshold_configurations').select('*').eq('config_key', 'telangana_hap_2026').single();
    const thresholds = config ? config.thresholds[user.worker_type || 'construction'] : DEFAULT_THRESHOLDS[user.worker_type || 'construction'];

    let riskLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';
    if (effectiveTemp >= thresholds.red) riskLevel = 'red';
    else if (effectiveTemp >= thresholds.orange) riskLevel = 'orange';
    else if (effectiveTemp >= thresholds.yellow) riskLevel = 'yellow';

    const recommendation = RecommendationService.getRecommendation(riskLevel, user.worker_type || 'construction');

    const assessment = {
      worker_id: user.id,
      site_id: siteId,
      effective_temp: effectiveTemp,
      risk_level: riskLevel,
      risk_score: effectiveTemp,
      confidence: 'high',
      explanation: \`Base HI: \${fahrenheitToCelsius(hi).toFixed(1)}°C, Adjustments applied for \${user.exposure}, \${user.intensity} intensity, \${user.clothing} clothing.\`,
      recommendation,
      timestamp: new Date().toISOString()
    };

    const { data } = await supabase.from('risk_assessments').insert(assessment).select().single();
    return data;
  }
}

export const riskService = new RiskService();
`,
  'src/services/recommendation.service.ts': `
import { RiskLevel, WorkerType } from '../types/user';

export class RecommendationService {
  static getRecommendation(riskLevel: RiskLevel, workerType: string) {
    if (riskLevel === 'red') {
      return {
        workStatus: "STOP WORK",
        restInstruction: "Rest immediately in active cooling/shade.",
        hydrationInstruction: "Drink 1 liter of cool water per hour.",
        additionalGuidance: workerType === 'construction' ? "Remove heavy PPE immediately." : "Seek AC environment immediately."
      };
    }
    if (riskLevel === 'orange') {
      return {
        workStatus: "MODIFY WORK",
        restInstruction: "45 mins work / 15 mins rest in shade.",
        hydrationInstruction: "Drink 750ml water per hour.",
        additionalGuidance: "Buddy system mandatory. Monitor for symptoms."
      };
    }
    if (riskLevel === 'yellow') {
      return {
        workStatus: "CAUTION",
        restInstruction: "Take breaks when fatigued.",
        hydrationInstruction: "Drink 500ml water per hour.",
        additionalGuidance: "Wear light clothing."
      };
    }
    return {
      workStatus: "NORMAL",
      restInstruction: "Standard breaks.",
      hydrationInstruction: "Drink water when thirsty.",
      additionalGuidance: "Normal operations."
    };
  }
}
`,
  'src/services/stoppage.service.ts': `
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
`,
  'src/services/alert.service.ts': `
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
`,
  'src/services/escalation.service.ts': `
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
`,
  'src/services/compliance.service.ts': `
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
`,
  'src/services/auth.service.ts': `
import { supabase } from '../config/supabase';

export class AuthService {
  async register(email: string, password: string,userData: any) {
    // In a real app we'd use Supabase Auth signup
    // For now returning mock or using direct insert for demo
    const { data, error } = await supabase.from('users').insert({ email, ...userData }).select().single();
    if (error) throw error;
    return data;
  }
  
  async login(email: string, password: string) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) throw error;
    return { user: data, token: 'mock-jwt-token-for-demo' };
  }
}
export const authService = new AuthService();
`,

  // Middleware
  'src/middleware/auth.ts': `
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/api';
import { supabase } from '../config/supabase';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Simplified mock auth
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  // For demo, fetch first user
  const { data } = await supabase.from('users').select('*').limit(1).single();
  if (data) req.user = data;
  next();
};
`,
  'src/middleware/rbac.ts': `
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/api';

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
`,
  'src/middleware/rateLimit.ts': `
import { Request, Response, NextFunction } from 'express';
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Mock rate limiter
  next();
};
`,
  'src/middleware/validation.ts': `
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      res.status(400).json({ error });
    }
  };
};
`,

  // Validators
  'src/validators/auth.validator.ts': `
import { z } from 'zod';
export const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(6) }) });
`,
  'src/validators/profile.validator.ts': `
import { z } from 'zod';
export const updateProfileSchema = z.object({ body: z.object({ name: z.string().optional() }) });
`,
  'src/validators/risk.validator.ts': `
import { z } from 'zod';
export const calculateRiskSchema = z.object({ body: z.object({ siteId: z.string() }) });
`,
  'src/validators/site.validator.ts': `
import { z } from 'zod';
export const createSiteSchema = z.object({ body: z.object({ name: z.string() }) });
`,

  // Routes
  'src/routes/auth.routes.ts': `
import { Router } from 'express';
import { authService } from '../services/auth.service';
export const authRoutes = Router();
authRoutes.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});
`,
  'src/routes/profile.routes.ts': `
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
export const profileRoutes = Router();
profileRoutes.get('/', authenticate, (req: any, res) => res.json(req.user));
`,
  'src/routes/site.routes.ts': `
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../config/supabase';
export const siteRoutes = Router();
siteRoutes.get('/', authenticate, async (req: any, res) => {
  const { data } = await supabase.from('sites').select('*');
  res.json(data);
});
`,
  'src/routes/weather.routes.ts': `
import { Router } from 'express';
import { weatherService } from '../services/weather.service';
export const weatherRoutes = Router();
weatherRoutes.get('/:siteId', async (req, res) => {
  const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.params.siteId);
  res.json(weather);
});
`,
  'src/routes/risk.routes.ts': `
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { riskService } from '../services/risk.service';
import { weatherService } from '../services/weather.service';
export const riskRoutes = Router();
riskRoutes.post('/calculate', authenticate, async (req: any, res) => {
  try {
    const weather = await weatherService.getCurrentWeather(17.448, 78.347, req.body.siteId);
    const risk = await riskService.calculateRisk(req.user, req.body.siteId, weather);
    res.json(risk);
  } catch(e: any) { res.status(500).json({error: e.message}); }
});
`,
  'src/routes/alert.routes.ts': `
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { alertService } from '../services/alert.service';
export const alertRoutes = Router();
alertRoutes.post('/:id/acknowledge', authenticate, async (req: any, res) => {
  const result = await alertService.acknowledgeAlert(req.params.id, req.user.id);
  res.json(result);
});
`,
  'src/routes/dashboard.routes.ts': `
import { Router } from 'express';
export const dashboardRoutes = Router();
dashboardRoutes.get('/sites', (req, res) => res.json({}));
`,
  'src/routes/escalation.routes.ts': `
import { Router } from 'express';
import { escalationService } from '../services/escalation.service';
export const escalationRoutes = Router();
escalationRoutes.post('/', async (req, res) => {
  const result = await escalationService.escalateAlert(req.body.alertId, req.body.level, req.body.siteId, req.body.workerId);
  res.json(result);
});
`,
  'src/routes/audit.routes.ts': `
import { Router } from 'express';
import { supabase } from '../config/supabase';
export const auditRoutes = Router();
auditRoutes.get('/:siteId', async (req, res) => {
  const { data } = await supabase.from('compliance_logs').select('*').eq('site_id', req.params.siteId);
  res.json(data);
});
`,
  'src/routes/config.routes.ts': `
import { Router } from 'express';
import { supabase } from '../config/supabase';
export const configRoutes = Router();
configRoutes.get('/thresholds', async (req, res) => {
  const { data } = await supabase.from('threshold_configurations').select('*');
  res.json(data);
});
`,

  // Jobs
  'src/jobs/alertScheduler.ts': `export const runAlertScheduler = () => console.log('Alert scheduler started');`,
  'src/jobs/escalationChecker.ts': `export const runEscalationChecker = () => console.log('Escalation checker started');`,
  'src/jobs/riskUpdater.ts': `export const runRiskUpdater = () => console.log('Risk updater started');`,

  // Main Entry
  'src/index.ts': `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { profileRoutes } from './routes/profile.routes';
import { siteRoutes } from './routes/site.routes';
import { weatherRoutes } from './routes/weather.routes';
import { riskRoutes } from './routes/risk.routes';
import { alertRoutes } from './routes/alert.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { escalationRoutes } from './routes/escalation.routes';
import { auditRoutes } from './routes/audit.routes';
import { configRoutes } from './routes/config.routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/sites', siteRoutes);
apiRouter.use('/weather', weatherRoutes);
apiRouter.use('/risk', riskRoutes);
apiRouter.use('/alerts', alertRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/escalation', escalationRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/config', configRoutes);

app.use('/api/v1', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(\`Server is running on port \${config.port}\`);
});
`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(__dirname, filePath), content.trim());
}

console.log('Backend scaffolded successfully.');
