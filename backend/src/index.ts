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

const server = app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERROR] Port ${config.port} is already in use by another process.`);
  } else {
    console.error('[ERROR] Server failure:', err);
  }
  process.exit(1);
});