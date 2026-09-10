# 04. API Contracts

The backend provides REST APIs to handle complex logic like fetching weather data, executing the risk engine, and triggering escalations. Data reading is mostly handled via direct Supabase Client in the frontend.

## Base URL: `/api/v1`

---

### 1. Synchronize Weather Data
**Endpoint:** `POST /weather/sync`
**Description:** Fetches latest data from OpenWeatherMap/NOAA for active sites and saves to `weather_readings`.
**Auth Required:** Yes (Cron or Authority)
**Request Body:** None
**Response:**
```json
{
  "success": true,
  "message": "Weather data synced for 3 sites.",
  "timestamp": "2026-09-09T18:20:51+05:30"
}
```

---

### 2. Run Risk Engine
**Endpoint:** `POST /risk/calculate`
**Description:** Evaluates risk for all active workers based on the latest weather readings and their worker types. Generates `risk_assessments` and `alerts`.
**Auth Required:** Yes (Cron or Authority/Supervisor triggering manually)
**Request Body:**
```json
{
  "site_id": "optional-uuid-to-run-for-specific-site"
}
```
**Response:**
```json
{
  "success": true,
  "assessments_created": 45,
  "alerts_generated": 12
}
```

---

### 3. Raise Escalation (Worker/Supervisor)
**Endpoint:** `POST /escalations`
**Description:** Used by workers to report severe distress (SOS) or supervisors to escalate a site-wide issue.
**Auth Required:** Yes (Worker, Supervisor)
**Request Body:**
```json
{
  "site_id": "uuid-here",
  "reason": "Worker collapsed due to heat stroke.",
  "triggered_by": "uuid-here"
}
```
**Response:**
```json
{
  "success": true,
  "escalation_id": "uuid",
  "status": "pending"
}
```

---

### 4. Resolve Escalation (Authority/Supervisor)
**Endpoint:** `PATCH /escalations/:id/resolve`
**Description:** Marks an escalation as resolved and logs compliance action.
**Auth Required:** Yes (Supervisor, Authority)
**Request Body:**
```json
{
  "action_taken": "Ambulance dispatched and worker hydrated. Operations paused for 2 hours."
}
```
**Response:**
```json
{
  "success": true,
  "escalation_id": "uuid",
  "status": "resolved"
}
```
