# Suraksha Heat Shield - Mobile Application (Expo / React Native)

A complete React Native mobile application for **Suraksha Heat Shield** built with Expo SDK 57, TypeScript, Supabase, TanStack Query, and native text-to-speech (`expo-speech`).

The mobile app connects to the existing backend and Supabase database without modifying the web application or backend services.

---

## Features

- **Supabase Authentication**:
  - Worker Demo OTP login (phone: `9876543210`, OTP: `1234`).
  - Password login (Email or Phone).
  - Role-based account registration (Worker, Supervisor, Authority).
  - Persistent session management with `@react-native-async-storage/async-storage`.
- **Worker Experience**:
  - **Home Dashboard**: Live ambient weather (temperature, humidity, UV index), personalized heat risk index, scenario switcher (Safe, Caution, Danger) with Supabase persistence.
  - **Alerts & Multilingual Voice Alert**: Real active alerts feed with native voiceover in **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English** powered by `expo-speech` and `voiceAlertGenerator.ts`.
  - **Personalized Risk Factors**: Clothing / PPE burden, shift duration, sun exposure, work intensity.
  - **Worker Profile**: Complete profile editor syncing changes to Supabase and triggering backend risk recalculations.
  - **Actionable Safety Recommendations**: Hydration, mandatory shade intervals, and medical emergency guidelines.
- **Supervisor Dashboard**:
  - Fleet risk distribution bar (Safe / Caution / Danger).
  - Managed sites list with exposure status.
  - Workers overview and assigned sites.
  - One-tap sample site assignment via backend API.
- **District Authority Overview**:
  - District-wide KPIs (Active Sites, Total Workers, High Heat Sites, Pending Escalations).
  - Monitored region active alerts.
  - System-wide worker risk distribution.

---

## Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Important: LAN IP for Physical Devices

When running in **Expo Go on a physical phone**, `localhost` refers to the phone itself.
Set `EXPO_PUBLIC_API_URL` to your development machine's local Wi-Fi IP address:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.157:5000/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://hjhqobuwizzxjgltvlix.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8DfJg-7uH6VQ4ZbpRKHlMA_3Zd-C_w7
```

*Note: You can also use the production Render backend URL: `https://heat-guard-backend.onrender.com/api/v1`.*

---

## Running the App with Expo Go

1. Navigate to the `mobile/` directory:

```bash
cd mobile
```

2. Start the Expo development server:

```bash
npx expo start
```

3. Scan the QR code with:
   - **Android**: The **Expo Go** app (available on Google Play Store).
   - **iOS**: The native Camera app.

Ensure your mobile phone is connected to the **same Wi-Fi network** as your development machine.
