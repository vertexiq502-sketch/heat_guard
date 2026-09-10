export type Role = 'worker' | 'supervisor' | 'authority';

export interface User {
  id: string;
  email: string;
  role: Role;
  language: string;
  name?: string | null;
  phone?: string | null;
  worker_type?: string | null;
  intensity?: string | null;
  exposure?: string | null;
  duration?: string | null;
  clothing?: string | null;
  is_unacclimatized?: boolean | null;
}
