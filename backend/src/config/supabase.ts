import { createClient } from '@supabase/supabase-js';
import { config } from './index';

// Service-role client: bypasses RLS, used for all server-side DB queries and admin operations
export const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Public/anon client: required for signInWithPassword — service_role key cannot verify user passwords
export const supabaseAuth = createClient(config.supabaseUrl, config.supabaseAnonKey);