import axios from 'axios';
import { supabase } from '../lib/supabase';

function getBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL || 'https://heat-guard-backend.onrender.com/api/v1').trim();

  // Fix accidental protocol typos (e.g., 'hhttps://' -> 'https://')
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
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      supabase.auth.signOut().then(() => {
        window.location.href = '/login';
      });
    }
    return Promise.reject(error);
  }
);