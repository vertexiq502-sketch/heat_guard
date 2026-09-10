const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirs = [
  'api',
  'components/common',
  'components/worker',
  'components/supervisor',
  'components/authority',
  'hooks',
  'lib',
  'locales',
  'pages/auth',
  'pages/worker',
  'pages/supervisor',
  'pages/authority',
  'store',
  'types',
  'utils'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
});

// We generate the public folder for the PWA manifest
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });

const files = {
  // Types
  'types/user.ts': `
export type Role = 'worker' | 'supervisor' | 'authority';
export interface User { id: string; email: string; role: Role; language: string; name?: string; }
`,
  'types/site.ts': `export interface Site { id: string; name: string; risk_level: string; }`,
  'types/risk.ts': `export interface RiskData { effective_temp: number; risk_level: string; recommendation: any; }`,
  'types/alert.ts': `export interface Alert { id: string; message: string; severity: string; }`,
  'types/api.ts': `export interface ApiResponse<T> { data: T; error?: string; }`,

  // API Client
  'api/client.ts': `
import axios from 'axios';
export const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' }
});
`,

  // Store
  'store/authStore.ts': `
import { create } from 'zustand';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
`,

  // Locales
  'locales/en.json': `
{
  "login": "Login",
  "safe": "Safe",
  "caution": "Caution",
  "high_risk": "High Risk",
  "danger": "Danger",
  "stop_work": "Stop outdoor work immediately",
  "rest_instruction": "Rest in shade for 15 minutes",
  "hydration_instruction": "Drink 2 glasses of water"
}`,
  'locales/te.json': `
{
  "login": "లాగిన్",
  "safe": "సురక్షితం",
  "caution": "జాగ్రత్త",
  "high_risk": "అధిక ప్రమాదం",
  "danger": "ప్రమాదం",
  "stop_work": "వెంటనే బయట పని ఆపండి",
  "rest_instruction": "నీడలో 15 నిమిషాలు విశ్రాంతి తీసుకోండి",
  "hydration_instruction": "2 గ్లాసుల నీరు త్రాగండి"
}`,
  'locales/hi.json': `
{
  "login": "लॉग इन करें",
  "safe": "सुरक्षित",
  "caution": "सावधान",
  "high_risk": "उच्च जोखिम",
  "danger": "खतरा",
  "stop_work": "तुरंत बाहर का काम बंद करें",
  "rest_instruction": "छाया में 15 मिनट आराम करें",
  "hydration_instruction": "2 गिलास पानी पिएं"
}`,

  // Hooks
  'hooks/useLocalization.ts': `
import { useState } from 'react';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

const translations: Record<string, any> = { en, te, hi };

export const useLocalization = () => {
  const [language, setLanguage] = useState('en');
  const t = (key: string) => translations[language][key] || key;
  return { language, setLanguage, t };
};
`,
  'hooks/useRealtime.ts': `
import { useEffect } from 'react';
// import { supabase } from '../lib/supabase'; // Placeholder for actual implementation
export const useRealtime = () => {
  useEffect(() => {
    console.log('Realtime subscribed');
  }, []);
};
`,

  // Components
  'components/common/LanguageSwitcher.tsx': `
import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLocalization();
  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-2 border rounded">
      <option value="en">English</option>
      <option value="te">తెలుగు</option>
      <option value="hi">हिंदी</option>
    </select>
  );
};
`,
  'components/common/RiskIndicator.tsx': `
import React from 'react';
export const RiskIndicator = ({ level }: { level: string }) => {
  const colors: Record<string, string> = { green: 'bg-green-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500', red: 'bg-red-500' };
  return <div className={\`p-4 rounded text-white font-bold \${colors[level] || 'bg-gray-500'}\`}>Risk Level: {level.toUpperCase()}</div>;
};
`,
  'components/common/ProtectedRoute.tsx': `
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <div>Unauthorized</div>;
  return <>{children}</>;
};
`,

  // Pages
  'pages/auth/Login.tsx': `
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const { t } = useLocalization();

  const handleLogin = (role: 'worker' | 'supervisor' | 'authority') => {
    setUser({ id: '1', email: 'demo@test.com', role, language: 'en' });
    navigate(\`/\${role}/home\`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-bold">Heat Guard</h1>
      <LanguageSwitcher />
      <button className="bg-blue-500 text-white p-2 rounded" onClick={() => handleLogin('worker')}>{t('login')} as Worker</button>
      <button className="bg-green-500 text-white p-2 rounded" onClick={() => handleLogin('supervisor')}>{t('login')} as Supervisor</button>
      <button className="bg-purple-500 text-white p-2 rounded" onClick={() => handleLogin('authority')}>{t('login')} as Authority</button>
    </div>
  );
};
`,
  'pages/worker/Home.tsx': `
import React from 'react';
import { RiskIndicator } from '../../components/common/RiskIndicator';
import { useRealtime } from '../../hooks/useRealtime';

export const WorkerHome = () => {
  useRealtime();
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Worker Dashboard</h1>
      <RiskIndicator level="orange" />
      <p>Effective Temperature: 36°C</p>
    </div>
  );
};
`,
  'pages/supervisor/Dashboard.tsx': `
import React from 'react';
export const SupervisorDashboard = () => <div className="p-4"><h1>Supervisor Dashboard</h1></div>;
`,
  'pages/authority/Overview.tsx': `
import React from 'react';
export const AuthorityOverview = () => <div className="p-4"><h1>Authority Overview</h1></div>;
`,

  // Stubs for other requested pages
  'pages/auth/Onboarding.tsx': `export const Onboarding = () => <div>Onboarding</div>;`,
  'pages/worker/Recommendations.tsx': `export const Recommendations = () => <div>Recommendations</div>;`,
  'pages/worker/Alerts.tsx': `export const Alerts = () => <div>Alerts</div>;`,
  'pages/worker/AlertHistory.tsx': `export const AlertHistory = () => <div>AlertHistory</div>;`,
  'pages/worker/Profile.tsx': `export const Profile = () => <div>Profile</div>;`,
  'pages/supervisor/SiteDetail.tsx': `export const SiteDetail = () => <div>SiteDetail</div>;`,
  'pages/supervisor/RiskMapView.tsx': `export const RiskMapView = () => <div>RiskMapView</div>;`,
  'pages/supervisor/AlertCenter.tsx': `export const AlertCenter = () => <div>AlertCenter</div>;`,
  'pages/supervisor/Compliance.tsx': `export const Compliance = () => <div>Compliance</div>;`,
  'pages/authority/EscalationDetail.tsx': `export const EscalationDetail = () => <div>EscalationDetail</div>;`,
  'pages/authority/Reports.tsx': `export const Reports = () => <div>Reports</div>;`,

  // Core App
  'App.tsx': `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { WorkerHome } from './pages/worker/Home';
import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import { AuthorityOverview } from './pages/authority/Overview';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Worker Routes */}
        <Route path="/worker/*" element={<ProtectedRoute allowedRoles={['worker']}>
          <Routes>
            <Route path="home" element={<WorkerHome />} />
            <Route path="*" element={<Navigate to="home" />} />
          </Routes>
        </ProtectedRoute>} />

        {/* Supervisor Routes */}
        <Route path="/supervisor/*" element={<ProtectedRoute allowedRoles={['supervisor']}>
          <Routes>
            <Route path="dashboard" element={<SupervisorDashboard />} />
            <Route path="*" element={<Navigate to="dashboard" />} />
          </Routes>
        </ProtectedRoute>} />

        {/* Authority Routes */}
        <Route path="/authority/*" element={<ProtectedRoute allowedRoles={['authority']}>
          <Routes>
            <Route path="overview" element={<AuthorityOverview />} />
            <Route path="*" element={<Navigate to="overview" />} />
          </Routes>
        </ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
`,
  'main.tsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

  // Manifest
  '../public/manifest.json': `
{
  "name": "Suraksha Heat Shield",
  "short_name": "Heat Shield",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e293b",
  "icons": [
    {
      "src": "/vite.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filePath), content.trim());
}

console.log('Frontend scaffolded successfully.');
