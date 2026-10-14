import { z } from 'zod';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../constants.js';
import { dateOnly, paginationQuery, stripEmpty } from './common.js';

const required = {
  employeeId: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, digits and hyphens')
    .transform((v) => v.toUpperCase()),
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[\p{L}][\p{L} .'-]*$/u, 'Name contains invalid characters'),
  email: z.string().trim().max(254).email('Enter a valid email').transform((v) => v.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 -]{6,18}$/, 'Enter a valid phone number'),
  department: z.enum(DEPARTMENTS),
  role: z.string().trim().min(2).max(100),
  joiningDate: dateOnly,
};

const optional = {
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  leaveStart: dateOnly.nullish(),
  leaveEnd: dateOnly.nullish(),
};

// Cross-field rules (leave dates vs status) are enforced in domain/rules.js, not here.
export const createEmployeeSchema = z.object({ ...required, ...optional }).strict();
export const updateEmployeeSchema = z.object({ ...required, ...optional }).partial().strict();

export const employeeListQuerySchema = z.preprocess(
  stripEmpty,
  paginationQuery.extend({
    search: z.string().trim().max(100).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    sort: z.enum(['fullName', 'joiningDate', 'employeeId']).default('fullName'),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
);
