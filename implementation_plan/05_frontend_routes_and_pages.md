# 05. Frontend Routes & Pages Hierarchy

The React frontend uses React Router. Access is restricted based on the user's role.

## Routing Structure

### Public Routes
- `/login` -> `src/pages/public/Login.tsx` (Supabase Auth email/password)
- `/unauthorized` -> `src/pages/public/Unauthorized.tsx`

### Worker Routes (Role: `worker`)
Layout: `src/layouts/WorkerLayout.tsx` (Mobile-first, bottom navigation bar)
- `/worker/onboarding` -> `src/pages/worker/Onboarding.tsx` (Select language: Telugu/Hindi/English, Worker Type)
- `/worker/home` -> `src/pages/worker/Home.tsx` (Current Risk Ring, Weather, Quick SOS Button)
- `/worker/recommendations` -> `src/pages/worker/Recommendations.tsx` (Hydration reminders, shade breaks)
- `/worker/alerts` -> `src/pages/worker/Alerts.tsx` (Push notification history)
- `/worker/profile` -> `src/pages/worker/Profile.tsx` (Settings, Language Toggle)

### Supervisor Routes (Role: `supervisor`)
Layout: `src/layouts/SupervisorLayout.tsx` (Tablet/Desktop optimized, Side drawer)
- `/supervisor/dashboard` -> `src/pages/supervisor/DashboardOverview.tsx` (Multi-site risk summary, active alerts)
- `/supervisor/sites/:id` -> `src/pages/supervisor/SiteDetail.tsx` (Workers list, live metrics, site-specific actions)
- `/supervisor/alerts` -> `src/pages/supervisor/AlertCenter.tsx` (Actionable alerts requiring supervisor intervention)
- `/supervisor/map` -> `src/pages/supervisor/RiskMap.tsx` (Leaflet map with thermal overlay or site markers)
- `/supervisor/compliance` -> `src/pages/supervisor/ComplianceLogs.tsx` (Forms to log water distribution, shade setups)

### Authority Routes (Role: `authority`)
Layout: `src/layouts/AuthorityLayout.tsx` (Desktop optimized, Data-heavy)
- `/authority/overview` -> `src/pages/authority/Overview.tsx` (State/City level aggregates, critical escalations)
- `/authority/escalations/:id` -> `src/pages/authority/EscalationDetail.tsx` (Audit trail, resolution tracking)
- `/authority/reports` -> `src/pages/authority/Reports.tsx` (Analytics, historical heat stress compliance exports)

## Component Tree Mapping Example
```text
src/
├── components/
│   ├── ui/ (Buttons, Cards, Modals - generic)
│   ├── worker/ (RiskRing, SOSButton, LocalizedAlertCard)
│   ├── supervisor/ (SiteMetricCard, WorkerListTable)
│   └── authority/ (EscalationTable, AggregateChart)
├── layouts/
│   ├── AuthLayout.tsx
│   ├── WorkerLayout.tsx
│   ├── SupervisorLayout.tsx
│   └── AuthorityLayout.tsx
├── pages/
│   └── [As mapped above]
├── hooks/
│   ├── useSupabaseAuth.ts
│   ├── useWeather.ts
│   └── useAlerts.ts
└── services/
    ├── api.ts (Backend Axios calls)
    └── supabase.ts (Direct DB queries)
```
