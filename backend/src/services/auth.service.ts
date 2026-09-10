import { supabase, supabaseAuth } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// TODO: Replace demo OTP verification with real Supabase/production OTP authentication before production deployment.
export const DEMO_OTP = '1234';

/**
 * Verifies demo OTP for hackathon MVP.
 * TODO: Replace demo OTP verification with real Supabase/production OTP authentication before production deployment.
 */
export function verifyDemoOtp(otp: string): boolean {
  if (!otp || typeof otp !== 'string') return false;
  return otp.trim() === DEMO_OTP;
}

export function normalizePhoneCandidates(rawPhone: string): string[] {
  if (!rawPhone) return [];
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');
  const candidates = new Set<string>();

  if (cleaned) candidates.add(cleaned);
  if (digitsOnly.length >= 10) {
    const last10 = digitsOnly.slice(-10);
    candidates.add(last10);
    candidates.add(`+91${last10}`);
    candidates.add(`91${last10}`);
    candidates.add(`0${last10}`);
  }

  return Array.from(candidates);
}

export class AuthService {
  /**
   * Look up a user by phone number using candidate phone formats.
   */
  async findUserByPhone(phone: string) {
    const candidates = normalizePhoneCandidates(phone);
    if (candidates.length === 0) return null;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .in('phone', candidates);

    if (error) {
      console.error('Error finding user by phone:', error);
      return null;
    }

    return users && users.length > 0 ? users[0] : null;
  }

  /**
   * Pre-validates a worker's phone number and prepares demo OTP.
   */
  async sendDemoOtp(phone: string) {
    if (!phone || typeof phone !== 'string') {
      const err: any = new Error('Please enter a valid phone number.');
      err.code = 'INVALID_PHONE';
      err.statusCode = 400;
      throw err;
    }

    const candidates = normalizePhoneCandidates(phone);
    const user = await this.findUserByPhone(phone);
    console.log(`[sendDemoOtp] phone="${phone}", candidates=${JSON.stringify(candidates)}, found=${user ? `${user.name} (${user.role})` : 'null'}`);

    if (!user) {
      const err: any = new Error('No worker account found for this phone number.');
      err.code = 'WORKER_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (user.role !== 'worker') {
      const err: any = new Error('OTP login is only available for workers. Please use password login.');
      err.code = 'WORKER_ONLY';
      err.statusCode = 403;
      throw err;
    }

    return {
      success: true,
      phone: user.phone,
      message: 'Demo OTP is ready. For MVP demo, use OTP 1234.'
    };
  }

  /**
   * Verifies demo OTP and establishes a genuine Supabase Auth session for the worker.
   */
  async verifyDemoOtpAndLogin(phone: string, otp: string) {
    // 1. Verify demo OTP
    if (!verifyDemoOtp(otp)) {
      const err: any = new Error('Invalid OTP. Please try again.');
      err.code = 'INVALID_OTP';
      err.statusCode = 400;
      throw err;
    }

    // 2. Find worker
    const candidates = normalizePhoneCandidates(phone);
    const user = await this.findUserByPhone(phone);
    console.log(`[verifyDemoOtpAndLogin] phone="${phone}", candidates=${JSON.stringify(candidates)}, found=${user ? `${user.name} (${user.role})` : 'null'}`);

    if (!user) {
      const err: any = new Error('No worker account found for this phone number.');
      err.code = 'WORKER_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (user.role !== 'worker') {
      const err: any = new Error('OTP login is only available for workers. Please use password login.');
      err.code = 'WORKER_ONLY';
      err.statusCode = 403;
      throw err;
    }

    // 3. Generate a genuine Supabase Auth session using Admin API magiclink exchange
    const linkRes = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (linkRes.error || !linkRes.data?.properties?.email_otp) {
      console.error('Failed to generate Supabase Auth magiclink token:', linkRes.error);
      const err: any = new Error('Authentication failed. Please try again.');
      err.code = 'AUTH_ERROR';
      err.statusCode = 500;
      throw err;
    }

    const emailOtp = linkRes.data.properties.email_otp;
    const tempAuth = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const verifyRes = await tempAuth.auth.verifyOtp({
      email: user.email,
      token: emailOtp,
      type: 'magiclink'
    });

    if (verifyRes.error || !verifyRes.data.session) {
      console.error('Failed to verify Supabase Auth OTP:', verifyRes.error);
      const err: any = new Error('Session establishment failed. Please try again.');
      err.code = 'SESSION_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return {
      user,
      session: verifyRes.data.session
    };
  }

  /**
   * Password login supporting both email and phone number.
   */
  async loginWithPassword(identifier: string, password: string) {
    if (!identifier || !password) {
      const err: any = new Error('Phone number/Email and password are required.');
      err.code = 'MISSING_FIELDS';
      err.statusCode = 400;
      throw err;
    }

    let targetEmail = identifier.trim();

    // If identifier is not an email, treat as phone number
    if (!targetEmail.includes('@')) {
      const user = await this.findUserByPhone(targetEmail);
      if (!user) {
        const err: any = new Error('Invalid credentials.');
        err.code = 'INVALID_CREDENTIALS';
        err.statusCode = 400;
        throw err;
      }
      targetEmail = user.email;
    }

    // Use anon-key client for signInWithPassword — service_role key does NOT support this
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: targetEmail,
      password
    });

    if (authError || !authData.user) {
      const err: any = new Error(authError?.message || 'Invalid credentials.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 400;
      throw err;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: profile || authData.user,
      session: authData.session
    };
  }

  async register(email: string, password: string, userData: any) {
    const { data, error } = await supabase.from('users').insert({ email, ...userData }).select().single();
    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();