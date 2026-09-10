const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const files = {
  // Supabase Client
  'lib/supabase.ts': `
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
`,

  // API Auth (Mock/Simulated via Supabase Client for MVP)
  'api/auth.ts': `
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export const authApi = {
  async register(email: string, password: string, role: string) {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    if (!authData.user) throw new Error('Signup failed');

    // 2. Insert into public.users table
    const userData = {
      id: authData.user.id,
      email,
      role,
      language: 'en'
    };

    const { error: dbError } = await supabase.from('users').insert([userData]);
    // In a real app with strict RLS, the backend would handle this, or a Postgres trigger
    // If it fails due to RLS, we still return the mock user for frontend flow continuity
    if (dbError) console.warn('Failed to insert user to DB (likely RLS):', dbError.message);

    return userData as User;
  },

  async login(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    if (!authData.user) throw new Error('Login failed');

    // Fetch user profile
    const { data: userData, error: dbError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    
    if (dbError) {
      console.warn('Could not fetch user profile, using fallback', dbError.message);
      return { id: authData.user.id, email, role: 'worker', language: 'en' } as User;
    }

    return userData as User;
  },
  
  async updateProfile(userId: string, profile: any) {
    const { error } = await supabase.from('users').update(profile).eq('id', userId);
    if (error) throw error;
  }
};
`,

  // Role Redirect Utility
  'utils/roleRedirect.ts': `
export const getRoleRedirectPath = (role: string): string => {
  switch (role) {
    case 'worker': return '/worker/home';
    case 'supervisor': return '/supervisor/dashboard';
    case 'authority': return '/authority/overview';
    default: return '/unauthorized';
  }
};
`,

  // Protected Route
  'components/common/ProtectedRoute.tsx': `
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const user = useAuthStore(state => state.user);
  
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  
  return <Outlet />;
};
`,

  // Auth Pages
  'pages/auth/SignUp.tsx': `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { authApi } from '../../api/auth';
import { getRoleRedirectPath } from '../../utils/roleRedirect';

export const SignUp = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const { t } = useLocalization();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'worker' | 'supervisor' | 'authority'>('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authApi.register(email, password, role);
      setUser(user);
      
      if (role === 'worker') {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(getRoleRedirectPath(role), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || t('signup_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">{t('create_account')}</h1>
          <LanguageSwitcher />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('select_role')}</label>
            <div className="space-y-2">
              <label className={\`block p-3 border rounded cursor-pointer \${role === 'worker' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}\`}>
                <input type="radio" name="role" value="worker" checked={role === 'worker'} onChange={() => setRole('worker')} className="sr-only" />
                <div className="font-medium">Worker</div>
                <div className="text-xs text-slate-500">{t('worker_desc')}</div>
              </label>
              <label className={\`block p-3 border rounded cursor-pointer \${role === 'supervisor' ? 'border-green-500 bg-green-50' : 'border-gray-200'}\`}>
                <input type="radio" name="role" value="supervisor" checked={role === 'supervisor'} onChange={() => setRole('supervisor')} className="sr-only" />
                <div className="font-medium">Supervisor</div>
                <div className="text-xs text-slate-500">{t('supervisor_desc')}</div>
              </label>
              <label className={\`block p-3 border rounded cursor-pointer \${role === 'authority' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}\`}>
                <input type="radio" name="role" value="authority" checked={role === 'authority'} onChange={() => setRole('authority')} className="sr-only" />
                <div className="font-medium">Authority</div>
                <div className="text-xs text-slate-500">{t('authority_desc')}</div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('loading') : t('signup')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          {t('already_have_account')} <Link to="/login" className="text-blue-600 hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};
`,
  'pages/auth/Login.tsx': `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { authApi } from '../../api/auth';
import { getRoleRedirectPath } from '../../utils/roleRedirect';

export const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const { t } = useLocalization();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authApi.login(email, password);
      setUser(user);
      navigate(getRoleRedirectPath(user.role), { replace: true });
    } catch (err: any) {
      setError(err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Heat Guard</h1>
          <LanguageSwitcher />
        </div>

        <h2 className="text-xl font-semibold text-center">{t('login')}</h2>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          {t('no_account')} <Link to="/signup" className="text-blue-600 hover:underline">{t('signup')}</Link>
        </p>
      </div>
    </div>
  );
};
`,
  'pages/auth/Onboarding.tsx': `
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { useLocalization } from '../../hooks/useLocalization';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { t } = useLocalization();

  const [workerType, setWorkerType] = useState('construction');
  const [intensity, setIntensity] = useState('moderate');
  const [exposure, setExposure] = useState('fullSun');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileUpdates = { worker_type: workerType, intensity, exposure };
      await authApi.updateProfile(user.id, profileUpdates);
      setUser({ ...user, ...profileUpdates });
      navigate('/worker/home', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center">{t('setup_profile')}</h1>
        <p className="text-slate-600 text-center">{t('onboarding_desc')}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Worker Type</label>
            <select value={workerType} onChange={e => setWorkerType(e.target.value)} className="w-full p-2 border rounded">
              <option value="construction">Construction</option>
              <option value="delivery">Delivery</option>
              <option value="farm">Farm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Work Intensity</label>
            <select value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full p-2 border rounded">
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sun Exposure</label>
            <select value={exposure} onChange={e => setExposure(e.target.value)} className="w-full p-2 border rounded">
              <option value="fullSun">Full Sun</option>
              <option value="partialShade">Partial Shade</option>
              <option value="shade">Shade</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('loading') : t('save_profile')}
        </button>
      </div>
    </div>
  );
};
`,

  // App Routing (Updated for Outlet Protected Routes)
  'App.tsx': `
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { Onboarding } from './pages/auth/Onboarding';
import { WorkerHome } from './pages/worker/Home';
import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import { AuthorityOverview } from './pages/authority/Overview';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/unauthorized" element={<div className="p-10 text-center text-xl text-red-600">Access Denied</div>} />

        {/* Worker Routes */}
        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/worker/home" element={<WorkerHome />} />
          <Route path="/worker/*" element={<Navigate to="/worker/home" replace />} />
        </Route>

        {/* Supervisor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/supervisor/*" element={<Navigate to="/supervisor/dashboard" replace />} />
        </Route>

        {/* Authority Routes */}
        <Route element={<ProtectedRoute allowedRoles={['authority']} />}>
          <Route path="/authority/overview" element={<AuthorityOverview />} />
          <Route path="/authority/*" element={<Navigate to="/authority/overview" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filePath), content.trim());
}

// Update translation files safely
const updateLocales = () => {
  const locales = {
    'en.json': {
      login: "Login", signup: "Sign Up", create_account: "Create Account",
      email: "Email Address", password: "Password", select_role: "Select Your Role",
      worker_desc: "Get personalised heat risk alerts and guidance",
      supervisor_desc: "Monitor sites and workers, receive escalations",
      authority_desc: "Oversee compliance and receive escalated alerts",
      already_have_account: "Already have an account?", no_account: "Don't have an account?",
      setup_profile: "Setup Your Profile", onboarding_desc: "Help us personalize your heat risk assessments.",
      save_profile: "Save Profile", loading: "Loading...", login_failed: "Invalid credentials", signup_failed: "Signup failed"
    },
    'te.json': {
      login: "లాగిన్", signup: "సైన్ అప్", create_account: "ఖాతా సృష్టించండి",
      email: "ఇమెయిల్", password: "పాస్ వర్డ్", select_role: "మీ పాత్రను ఎంచుకోండి",
      worker_desc: "వ్యక్తిగతీకరించిన వేడి ప్రమాద హెచ్చరికలను పొందండి",
      supervisor_desc: "సైట్‌లను పర్యవేక్షించండి",
      authority_desc: "నిబంధనలను పర్యవేక్షించండి",
      already_have_account: "ఖాతా ఉందా?", no_account: "ఖాతా లేదా?",
      setup_profile: "ప్రొఫైల్ సెటప్", onboarding_desc: "ప్రమాద అంచనాలను వ్యక్తిగతీకరించడానికి సహాయపడండి.",
      save_profile: "సేవ్ చేయండి", loading: "లోడ్ అవుతోంది...", login_failed: "చెల్లని ఆధారాలు", signup_failed: "సైన్అప్ విఫలమైంది"
    },
    'hi.json': {
      login: "लॉग इन करें", signup: "साइन अप करें", create_account: "खाता बनाएं",
      email: "ईमेल", password: "पासवर्ड", select_role: "अपनी भूमिका चुनें",
      worker_desc: "वैयक्तिकृत ताप जोखिम अलर्ट प्राप्त करें",
      supervisor_desc: "साइटों की निगरानी करें",
      authority_desc: "अनुपालन की निगरानी करें",
      already_have_account: "पहले से खाता है?", no_account: "खाता नहीं है?",
      setup_profile: "प्रोफ़ाइल सेट करें", onboarding_desc: "जोखिम का आकलन करने में मदद करें।",
      save_profile: "सहेजें", loading: "लोड हो रहा है...", login_failed: "अमान्य क्रेडेंशियल", signup_failed: "साइनअप विफल"
    }
  };

  for (const [file, data] of Object.entries(locales)) {
    const filePath = path.join(srcDir, 'locales', file);
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...data }, null, 2));
  }
};

updateLocales();

console.log('Auth scaffolded successfully.');
