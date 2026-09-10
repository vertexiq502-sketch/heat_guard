# 07. Build Order & Tasks Checklist

This sequential checklist outlines the execution plan for the Suraksha Heat Shield MVP.

## Phase 1: Setup & Infrastructure
- [ ] **Task 1: Initialize Monorepo** (Owner: DevOps)
  - Create frontend (Vite/React) and backend (Node/Express) skeletons.
  - Setup ESLint/Prettier.
- [ ] **Task 2: Supabase Project Setup** (Owner: DevOps/Backend)
  - Create project on Supabase.
  - Apply `02_database_schema.sql` via Supabase SQL Editor.
- [ ] **Task 3: Apply RLS Policies** (Owner: Backend)
  - Execute `03_supabase_rls_policies.sql`.
  - Verify roles cannot read unauthorized data.
- [ ] **Task 4: Environment Variables & Supabase Clients** (Owner: Frontend/Backend)
  - Set up `.env` files.
  - Initialize Supabase client instances in both frontend and backend.

## Phase 2: Authentication & Mock Data
- [ ] **Task 5: Authentication Flow** (Owner: Frontend Worker)
  - Build Login page.
  - Implement protected routes based on user role (`worker`, `supervisor`, `authority`).
- [ ] **Task 6: Seed Demo Data** (Owner: Data)
  - Write a seed script or manually insert: 3 Sites (e.g., Hyderabad Construction, Warangal Farm), 3 Workers, 1 Supervisor, 1 Authority.
  - Assign workers to sites. Ensure DB configs from `02_database_schema.sql` are present.

## Phase 3: Backend & Risk Engine
- [ ] **Task 7: Weather API Integration** (Owner: Backend)
  - Build `POST /api/weather/sync`.
  - Integrate OpenWeatherMap API. Map JSON response to `weather_readings`.
- [ ] **Task 8: Implement Risk Engine Logic** (Owner: Backend)
  - Translate `06_risk_engine_logic.md` into `src/services/RiskEngine.ts`.
- [ ] **Task 9: Risk Engine API Endpoint** (Owner: Backend)
  - Build `POST /api/risk/calculate`.
  - Generate `risk_assessments` and `alerts` inside a Supabase transaction.
- [ ] **Task 10: Escalation API** (Owner: Backend)
  - Build `POST /escalations` and `PATCH /escalations/:id/resolve`.

## Phase 4: Worker App (Mobile First)
- [ ] **Task 11: Worker Layout & Navigation** (Owner: Frontend Worker)
  - Build bottom tab navigator.
- [ ] **Task 12: Worker Home Page (Risk Ring)** (Owner: Frontend Worker)
  - Fetch latest `risk_assessments` for the logged-in worker.
  - Build circular UI component representing risk level (Green/Yellow/Orange/Red).
- [ ] **Task 13: Localized Alerts List** (Owner: Frontend Worker)
  - Fetch alerts. Implement basic toggle for English / Telugu / Hindi translation (MVP: store translations in DB or use simple dictionary).
- [ ] **Task 14: SOS / Help Button** (Owner: Frontend Worker)
  - Button calls `POST /api/escalations`.

## Phase 5: Supervisor Dashboard (Tablet/Desktop)
- [ ] **Task 15: Supervisor Layout** (Owner: Frontend Dashboard)
  - Side navigation for Dashboard, Sites, Alerts.
- [ ] **Task 16: Dashboard Overview** (Owner: Frontend Dashboard)
  - Aggregate widget showing sites managed by the supervisor and their current max risk levels.
- [ ] **Task 17: Site Details & Worker List** (Owner: Frontend Dashboard)
  - Show list of assigned workers and their current status.
- [ ] **Task 18: Supervisor Alert Center** (Owner: Frontend Dashboard)
  - Realtime subscription to `alerts` table for their sites using Supabase Realtime.
- [ ] **Task 19: Compliance Logging UI** (Owner: Frontend Dashboard)
  - Simple form to insert records into `compliance_logs`.

## Phase 6: Authority Dashboard
- [ ] **Task 20: Authority Overview** (Owner: Frontend Dashboard)
  - High-level metrics (Total escalations, critical sites).
- [ ] **Task 21: Escalation Management** (Owner: Frontend Dashboard)
  - View all pending `escalation_events` across all sites.
  - Ability to mark as resolved.

## Phase 7: Polish, Integration & Demo Prep
- [ ] **Task 22: Supabase Realtime Integration** (Owner: Frontend)
  - Ensure UI updates automatically when new `risk_assessments` or `alerts` are created.
- [ ] **Task 23: Map View (Supervisor)** (Owner: Frontend Dashboard)
  - Integrate React-Leaflet to show site locations.
- [ ] **Task 24: PWA Configuration** (Owner: DevOps/Frontend)
  - Add `manifest.json` and basic service worker to allow "Add to Home Screen" for workers.
- [ ] **Task 25: Cron Job Setup** (Owner: Backend)
  - Setup script to hit `/api/weather/sync` and `/api/risk/calculate` every 15 minutes (or simulate manually for demo).
- [ ] **Task 26: Testing Risk Engine** (Owner: QA)
  - Inject extreme weather values and verify Red alerts are generated and propagated.
- [ ] **Task 27: UI/UX Pass** (Owner: Frontend)
  - Tailwind cleanup, check responsive behaviors, add loading skeletons.
- [ ] **Task 28: Demo Polish** (Owner: All)
  - Final end-to-end walkthrough using the pre-loaded Telangana sites.
