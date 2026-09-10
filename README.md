# Suraksha Heat Shield

An automated, hyper-localized heat risk management system for India's informal workforce. Built with React, Node.js, and Supabase.

## Features

- **Hyper-Localized Risk Engine**: Calculates NOAA Heat Index tailored with specific worker profiles (clothing, intensity, exposure).
- **Automated Escalation Matrix**: Ensures accountability. If a worker ignores a critical alert, it escalates to their Supervisor, and eventually to the District Authority.
- **Multilingual Support**: Critical alerts are delivered natively in English, Telugu, and Hindi.
- **Role-Based Dashboards**: Distinct interfaces for Workers, Supervisors, and Authorities.
- **Open-Meteo Integration**: Fetches real-time weather data to feed the risk algorithm.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Supabase Project

### Backend Setup
\`\`\`bash
cd backend
npm install
npm run build
npm start
\`\`\`

### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Demo Credentials

You can test the end-to-end flow using these seeded demo accounts. The passwords for all demo accounts are \`password123\`.

| Role | Email | Profile Configuration | Expected Risk |
|------|-------|-----------------------|---------------|
| Worker 1 | \`worker1@heatguard.com\` | Construction, Heavy, Full Sun | ORANGE (High Risk) |
| Worker 2 | \`worker2@heatguard.com\` | Delivery, Moderate, Full Sun | YELLOW (Caution) |
| Supervisor | \`supervisor@heatguard.com\` | Oversees Site 1 & 3 | N/A |
| Authority | \`authority@heatguard.com\` | District Overseer | N/A |

*Note: For the exact flow and talking points, please refer to \`DEMO_SCRIPT.md\`.*
