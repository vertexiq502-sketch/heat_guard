import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/api';
import { supabase } from '../config/supabase';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  
  // Verify token with Supabase Auth
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.log('Auth error or no user:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Fetch full user profile
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (!profile) {
    console.log(`Auth: No application profile for Supabase user ${user.id} (${user.email}). Returning 401 to trigger frontend logout.`);
    // Return 401 so the frontend interceptor (api/client.ts) triggers signOut + redirect to /login
    return res.status(401).json({ error: 'Unauthorized: No application profile for this account' });
  }

  req.user = profile;
  next();
};

export const authorizeRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      console.log(`Forbidden: Requires ${role} role, but user has ${req.user?.role}`);
      return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
    }
    next();
  };
};