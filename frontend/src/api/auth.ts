import { supabase } from '../lib/supabase';
import { apiClient } from './client';
import { setAppLanguage } from '../hooks/useLocalization';
import type { User } from '../types/user';

/** Read the user's currently-selected language from the same source as useLocalization. */
const SUPPORTED_LANGUAGES = ['en', 'te', 'hi'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

function getCurrentSelectedLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem('heatguard_lang');
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // Ignore storage errors
  }
  return 'en';
}

export const authApi = {
  async register(email: string, password: string, role: string, phone: string) {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    if (!authData.user) throw new Error('Signup failed');

    // Clean phone number (same logic as backend)
    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    // Read the language the user has selected in the UI (persisted in localStorage)
    const language = getCurrentSelectedLanguage();

    // 2. Insert into public.users table
    const userData = {
      id: authData.user.id,
      email,
      role,
      phone: cleanedPhone,
      language,
    };

    const { error: dbError } = await supabase.from('users').insert([userData]);
    if (dbError) console.warn('Failed to insert user to DB (likely RLS):', dbError.message);

    return userData as User;
  },

  /**
   * Password login supporting both email and phone number.
   * Preserves authentic Supabase Auth session.
   */
  async login(identifier: string, password: string): Promise<User> {
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      // Direct Supabase sign in with email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      // Fetch user profile from public.users
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !userData) {
        // No application profile exists for this Supabase auth user.
        // Do NOT silently default to 'worker' — that would allow orphan auth accounts
        // to proceed and hit 403s on every protected API endpoint.
        await supabase.auth.signOut();
        throw new Error('No application profile found for this account. Please contact support or create an account.');
      }

      // Sync UI language with the user's persisted preference
      if (userData.language) setAppLanguage(userData.language);

      return userData as User;
    }

    // Phone number + password: authenticate via backend and establish Supabase session
    const response = await apiClient.post('/auth/password-login', {
      identifier: trimmed,
      password
    });

    const { user, session } = response.data;
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    }

    // Sync UI language with the user's persisted preference
    if (user?.language) setAppLanguage(user.language);

    return user as User;
  },

  /**
   * Request / pre-validate Demo OTP for worker phone number.
   */
  async sendDemoOtp(phone: string) {
    const response = await apiClient.post('/auth/send-demo-otp', {
      phone: phone.trim()
    });
    return response.data;
  },

  /**
   * Verify Demo OTP (1234) and establish real Supabase Auth session for worker.
   */
  async loginWithOtp(phone: string, otp: string): Promise<User> {
    const response = await apiClient.post('/auth/verify-demo-otp', {
      phone: phone.trim(),
      otp: otp.trim()
    });

    const { user, session } = response.data;
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    }

    // Sync UI language with the user's persisted preference
    if (user?.language) setAppLanguage(user.language);

    return user as User;
  },

  async updateProfile(userId: string, profile: any) {
    const { error } = await supabase.from('users').update(profile).eq('id', userId);
    if (error) throw error;
  }
};