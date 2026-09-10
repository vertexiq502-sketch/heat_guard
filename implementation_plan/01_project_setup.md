# 01. Project Setup & Configuration

This document outlines the steps to initialize the Suraksha Heat Shield project, comprising a React frontend and a Node.js backend.

## 1. Directory Structure
Create a root folder and initialize the frontend and backend directories.
```bash
mkdir suraksha-heat-shield
cd suraksha-heat-shield
```

## 2. Frontend Initialization (React + Vite + Tailwind)
```bash
# Initialize Vite project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install core dependencies
npm install react-router-dom @tanstack/react-query @supabase/supabase-js leaflet react-leaflet date-fns clsx tailwind-merge lucide-react

# Install development dependencies (Tailwind & PostCSS)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3. Backend Initialization (Node.js + Express + TS)
```bash
cd ../
mkdir backend
cd backend
npm init -y

# Install dependencies
npm install express @supabase/supabase-js dotenv cors helmet bcrypt jsonwebtoken zod

# Install TS development dependencies
npm install -D typescript @types/express @types/node @types/cors @types/bcrypt @types/jsonwebtoken ts-node-dev
npx tsc --init
```

Update `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 4. Environment Variables Templates

**Frontend `.env.example` (`frontend/.env.example`):**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000/api
```

**Backend `.env.example` (`backend/.env.example`):**
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_custom_jwt_secret
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
```
