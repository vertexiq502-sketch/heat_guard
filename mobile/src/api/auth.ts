import { supabase } from '../lib/supabase';
import { apiClient } from './client';
import { setAppLanguage } from '../hooks/useLocalization';
import type { User } from '../types/user';

export const authApi = {
  async register(email: string, password: string, role: string, phone: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Signup failed');

    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    const userData = {
      id: authData.user.id,
      email: email.trim(),
      role,
      phone: cleanedPhone,
      language: 'en',
    };

    const { error: dbError } = await supabase.from('users').insert([userData]);
    if (dbError) {
      console.warn('Failed to insert user to DB (likely RLS):', dbError.message);
    }

    return userData as User;
  },

  async login(identifier: string, password: string): Promise<User> {
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !userData) {
        await supabase.auth.signOut();
        throw new Error(
          'No application profile found for this account. Please contact support or create an account.'
        );
      }

      if (userData.language) setAppLanguage(userData.language);
      return userData as User;
    }

    // Phone number + password
    const response = await apiClient.post('/auth/password-login', {
      identifier: trimmed,
      password,
    });

    const { user, session } = response.data;
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    if (user?.language) setAppLanguage(user.language);
    return user as User;
  },

  async sendDemoOtp(phone: string) {
    const response = await apiClient.post('/auth/send-demo-otp', {
      phone: phone.trim(),
    });
    return response.data;
  },

  async loginWithOtp(phone: string, otp: string): Promise<User> {
    const response = await apiClient.post('/auth/verify-demo-otp', {
      phone: phone.trim(),
      otp: otp.trim(),
    });

    const { user, session } = response.data;
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    if (user?.language) setAppLanguage(user.language);
    return user as User;
  },

  async updateProfile(userId: string, profile: Partial<User>) {
    const { error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId);
    if (error) throw error;
  },
};
