import axios from 'axios';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

function getBaseUrl(): string {
  let url = (
    process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.157:5000/api/v1'
  ).trim();

  // Fix accidental protocol typos
  if (url.startsWith('hhttps://')) {
    url = url.replace(/^hhttps:\/\//, 'https://');
  } else if (url.startsWith('hhttp://')) {
    url = url.replace(/^hhttp:\/\//, 'http://');
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Ensure /api/v1 path is present
  if (url.endsWith('/api')) {
    url = `${url}/v1`;
  } else if (!url.includes('/api/v1') && !url.endsWith('/v1')) {
    url = `${url}/api/v1`;
  }

  return url;
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Failed to retrieve Supabase session for request:', err);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid; sign out and clear store
      try {
        await supabase.auth.signOut();
        useAuthStore.getState().setUser(null);
      } catch (e) {
        // Ignore signout errors
      }
    }
    return Promise.reject(error);
  }
);
