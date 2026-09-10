import { z } from 'zod';
export const calculateRiskSchema = z.object({ body: z.object({ siteId: z.string() }) });