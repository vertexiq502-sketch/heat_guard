# Suraksha Heat Shield - API Documentation

Base URL: \`http://localhost:5000/api/v1\`

## Authentication
Authentication is handled via Supabase JWT tokens. Include the token in the \`Authorization\` header:
\`Authorization: Bearer <your_jwt_token>\`

## Endpoints

### Health Check
\`GET /health\`
Returns the operational status of the API and database.
**Response:** \`{ "status": "ok", "db": "connected" }\`

### Risk Engine
\`POST /risk/calculate\`
Calculates the personalized risk for a worker.
**Body:**
\`\`\`json
{
  "workerId": "uuid",
  "siteId": "uuid"
}
\`\`\`
**Response:**
\`\`\`json
{
  "riskLevel": "orange",
  "effectiveTemp": 38.5,
  "confidence": "high",
  "recommendations": {
    "workStatus": "Work with caution",
    "restInstruction": "15 min rest per hour"
  }
}
\`\`\`

### Sites
\`GET /sites/:id\`
Retrieves site details and current risk distribution.
**Response:**
\`\`\`json
{
  "id": "uuid",
  "name": "Site 1",
  "current_risk": "orange",
  "workers_at_risk": 5
}
\`\`\`

### Alerts & Escalations
\`POST /alerts/acknowledge\`
Acknowledges an active alert.
**Body:** \`{ "alertId": "uuid" }\`

\`POST /escalations\`
Escalates an unacknowledged alert to the authority.
**Body:** \`{ "alertId": "uuid", "reason": "No response from supervisor" }\`
