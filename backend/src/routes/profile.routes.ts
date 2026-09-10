import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../config/supabase';
import {
  workerProfileUpdateSchema,
  supervisorProfileUpdateSchema,
  authorityProfileUpdateSchema,
  normalizePhone,
  stripProtectedFields,
} from '../validators/profile.validator';

export const profileRoutes = Router();

// ─── GET /profile — return the authenticated user's full profile ──────────────
profileRoutes.get('/', authenticate, (req: any, res) => res.json(req.user));

// ─── PATCH /profile — update own profile ─────────────────────────────────────
profileRoutes.patch('/', authenticate, async (req: any, res) => {
  try {
    const user = req.user; // identity from JWT — never from request body

    // 1. Strip any protected fields (role, id, email, etc.) from the payload
    const rawPayload = stripProtectedFields(req.body as Record<string, unknown>);

    // 2. Validate the payload according to the user's role
    let schema;
    if (user.role === 'worker') {
      schema = workerProfileUpdateSchema;
    } else if (user.role === 'supervisor') {
      schema = supervisorProfileUpdateSchema;
    } else if (user.role === 'authority') {
      schema = authorityProfileUpdateSchema;
    } else {
      return res.status(403).json({ error: 'Forbidden: Unknown role' });
    }

    const parseResult = schema.safeParse(rawPayload);
    if (!parseResult.success) {
      const messages = (parseResult.error.issues ?? (parseResult.error as any).errors ?? [])
      .map((e: { message: string }) => e.message)
      .join(', ');
      return res.status(400).json({ error: 'Validation failed', message: messages });
    }

    const validated = parseResult.data as Record<string, unknown>;

    // If payload is empty after stripping, nothing to do
    if (Object.keys(validated).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    // 3. Normalise phone if provided
    if ('phone' in validated) {
      if (typeof validated.phone === 'string' && validated.phone.trim().length > 0) {
        const normalised = normalizePhone(validated.phone);

        // Check uniqueness — reject if another user already has this phone
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('phone', normalised)
          .neq('id', user.id)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            error: 'Phone number already in use',
            message: 'This phone number is already registered to another account.',
          });
        }

        validated.phone = normalised;
      } else {
        validated.phone = null;
      }
    }

    validated.updated_at = new Date().toISOString();

    // 4. Update the user's own row in Supabase
    //    We use user.id (from JWT-verified middleware) — user cannot update another user's row
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(validated)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /profile] Supabase update error:', updateError);
      return res.status(500).json({ error: 'Database error', message: 'Failed to update profile.' });
    }

    return res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('[PATCH /profile] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', message: 'An unexpected error occurred.' });
  }
});