import { z } from 'zod';
export const createSiteSchema = z.object({ body: z.object({ name: z.string() }) });