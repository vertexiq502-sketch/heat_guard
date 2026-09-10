import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from './LanguageSwitcher';
import { supabase } from '../../lib/supabase';
import type { Role } from '../../types/user';

// ─── Nav item definition ──────────────────────────────────────────────────────

interface NavItem {
  labelKey: string;
  to: string;
  icon: string;
}

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'worker':
      return [
        { labelKey: 'nav_home',    to: '/worker/home', icon: '🏠' },
        { labelKey: 'nav_alerts',  to: '/worker/alerts', icon: '🔔' },
        { labelKey: 'nav_profile', to: '/worker/profile', icon: '👤' },
      ];
    case 'supervisor':
      return [
        { labelKey: 'nav_dashboard', to: '/supervisor/dashboard', icon: '📊' },
        { labelKey: 'nav_workers',   to: '/supervisor/dashboard', icon: '👷' },
        { labelKey: 'nav_sites',     to: '/supervisor/dashboard', icon: '📍' },
        { labelKey: 'nav_alerts',    to: '/supervisor/dashboard', icon: '🔔' },
        { labelKey: 'nav_profile',   to: '/supervisor/profile', icon: '👤' },
      ];
    case 'authority':
      return [
        { labelKey: 'nav_overview',         to: '/authority/overview', icon: '🏛️' },
        { labelKey: 'nav_sites',            to: '/authority/overview', icon: '📍' },
        { labelKey: 'nav_risk_monitoring',  to: '/authority/overview', icon: '⚠️' },
        { labelKey: 'nav_escalations',      to: '/authority/overview', icon: '🚨' },
        { labelKey: 'nav_profile',          to: '/authority/profile', icon: '👤' },
      ];
  }
}

function getRoleAccent(role: Role): string {
  switch (role) {
    case 'worker':     return 'bg-blue-700';
    case 'supervisor': return 'bg-green-700';
    case 'authority':  return 'bg-purple-700';
  }
}

function getRoleLabel(role: Role, t: (k: string) => string): string {
  switch (role) {
    case 'worker':     return t('role_worker');
    case 'supervisor': return t('role_supervisor');
    case 'authority':  return t('role_authority');
  }
}

// ─── Sidebar content (shared between desktop sidebar & mobile drawer) ─────────

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { user, setUser } = useAuthStore();
  const { t } = useLocalization();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const accent = getRoleAccent(user.role);
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className={`${accent} px-4 py-4`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🌡️</span>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Suraksha</div>
            <div className="text-white/70 text-xs">Heat Shield</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`${accent} w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">{getRoleLabel(user.role, t)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.labelKey}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                aria-label={t(item.labelKey)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-base w-5 text-center flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: language + logout */}
      <div className="px-2 py-3 border-t border-gray-200 space-y-1">
        <div className="px-3 py-1.5">
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          aria-label={t('logout')}
        >
          <span className="text-base w-5 text-center flex-shrink-0" aria-hidden="true">🚪</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main DashboardLayout ─────────────────────────────────────────────────────

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const { t } = useLocalization();

  if (!user) return null;

  const accent = getRoleAccent(user.role);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex md:flex-col md:w-60 md:flex-shrink-0 bg-white border-r border-gray-200 shadow-sm"
        aria-label="Sidebar"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={t('close_menu')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className={`${accent} md:hidden flex items-center gap-3 px-4 py-3 shadow-sm flex-shrink-0`}>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label={t('open_menu')}
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-bold text-base">Suraksha Heat Shield</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
