import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { Onboarding } from './pages/auth/Onboarding';
import { WorkerHome } from './pages/worker/Home';
import { Alerts as WorkerAlerts } from './pages/worker/Alerts';
import { Profile as WorkerProfile } from './pages/worker/Profile';
import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import { SupervisorProfile } from './pages/supervisor/Profile';
import { AuthorityOverview } from './pages/authority/Overview';
import { AuthorityProfile } from './pages/authority/Profile';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/common/DashboardLayout';
import { useAuthStore } from './store/authStore';
import { setAppLanguage } from './hooks/useLocalization';

export default function App() {
  // On every mount (including page refresh), sync the localization language
  // from the persisted user profile so the UI respects the DB-stored preference.
  const user = useAuthStore(state => state.user);
  useEffect(() => {
    if (user?.language) {
      setAppLanguage(user.language);
    }
  }, [user?.language]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes — no nav shell */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/unauthorized" element={<div className="p-10 text-center text-xl text-red-600">Access Denied</div>} />

        {/* ── Worker Routes (inside nav layout) ── */}
        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
          {/* Onboarding has no nav — it's a one-time setup before the main app */}
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<DashboardLayout />}>
            <Route path="/worker/home" element={<WorkerHome />} />
            <Route path="/worker/alerts" element={<WorkerAlerts />} />
            <Route path="/worker/profile" element={<WorkerProfile />} />
            <Route path="/worker/*" element={<Navigate to="/worker/home" replace />} />
          </Route>
        </Route>

        {/* ── Supervisor Routes (inside nav layout) ── */}
        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
            <Route path="/supervisor/profile" element={<SupervisorProfile />} />
            <Route path="/supervisor/*" element={<Navigate to="/supervisor/dashboard" replace />} />
          </Route>
        </Route>

        {/* ── Authority Routes (inside nav layout) ── */}
        <Route element={<ProtectedRoute allowedRoles={['authority']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/authority/overview" element={<AuthorityOverview />} />
            <Route path="/authority/profile" element={<AuthorityProfile />} />
            <Route path="/authority/*" element={<Navigate to="/authority/overview" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}