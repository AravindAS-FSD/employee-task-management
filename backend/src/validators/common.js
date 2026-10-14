import { z } from 'zod';
import { parseDateOnly } from '../utils/dates.js';

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format')
  .refine((v) => parseDateOnly(v) !== null, 'Not a valid calendar date')
  .transform((v) => parseDateOnly(v));

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/** Query params sent empty (?status=) count as "not set". */
export const stripEmpty = (input) =>
  Object.fromEntries(Object.entries(input ?? {}).filter(([, v]) => v !== ''));
