import { z } from 'zod';

// ─── Shared base fields (all roles can update these) ─────────────────────────

const baseProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .nullable()
    .optional(),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^\+?[\d\s\-()+]{7,20}$/.test(val),
      'Invalid phone number format'
    )
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  language: z
    .enum(['en', 'te', 'hi'])
    .nullable()
    .optional(),
});

// ─── Worker-specific fields ────────────────────────────────────────────────────

const workerExtraSchema = z.object({
  worker_type: z
    .enum(['construction', 'delivery', 'farm'])
    .nullable()
    .optional(),
  intensity: z
    .enum(['light', 'moderate', 'heavy'])
    .nullable()
    .optional(),
  exposure: z
    .enum(['fullSun', 'partialShade', 'shade'])
    .nullable()
    .optional(),
  duration: z
    .enum(['short', 'moderate', 'prolonged'])
    .nullable()
    .optional(),
  clothing: z
    .enum(['normal', 'moderatePPE', 'heavyPPE'])
    .nullable()
    .optional(),
});

// ─── Full schemas per role ────────────────────────────────────────────────────

/** Schema for worker profile update — includes risk-related fields */
export const workerProfileUpdateSchema = baseProfileSchema.merge(workerExtraSchema);

/** Schema for supervisor profile update */
export const supervisorProfileUpdateSchema = baseProfileSchema;

/** Schema for authority profile update */
export const authorityProfileUpdateSchema = baseProfileSchema;

// ─── Normalise phone number ───────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  // Keep leading + for E.164, strip spaces / dashes / parens
  return raw.replace(/[\s\-()]/g, '');
}

// ─── Strip protected fields from any incoming payload ─────────────────────────

/** NEVER allow clients to change these — always strip before UPDATE */
const PROTECTED_FIELDS = ['id', 'role', 'email', 'created_at', 'updated_at', 'is_active'];

export function stripProtectedFields(payload: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...payload };
  for (const field of PROTECTED_FIELDS) {
    delete safe[field];
  }
  return safe;
}