import { z } from 'zod';
import { DEPARTMENTS, PRIORITIES, TASK_STATUSES } from '../constants.js';
import { dateOnly, objectId, paginationQuery, stripEmpty } from './common.js';

// `status` and `completedDate` are deliberately absent: they change only via PUT /tasks/:id/status.
// .strict() turns any attempt to send them through the generic update into a 400.
const taskFields = {
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  assignedEmployee: objectId,
  department: z.enum(DEPARTMENTS),
  priority: z.enum(PRIORITIES),
  startDate: dateOnly,
  dueDate: dateOnly,
};

export const createTaskSchema = z.object(taskFields).strict();
export const updateTaskSchema = z.object(taskFields).partial().strict();
export const statusSchema = z.object({ status: z.enum(TASK_STATUSES) }).strict();

export const taskListQuerySchema = z.preprocess(
  stripEmpty,
  paginationQuery
    .extend({
      search: z.string().trim().max(100).optional(),
      department: z.enum(DEPARTMENTS).optional(),
      priority: z.enum(PRIORITIES).optional(),
      status: z.enum([...TASK_STATUSES, 'Overdue']).optional(),
      employee: objectId.optional(),
      dueFrom: dateOnly.optional(),
      dueTo: dateOnly.optional(),
      sort: z.enum(['createdDate', 'dueDate', 'priority', 'title']).default('createdDate'),
      order: z.enum(['asc', 'desc']).default('desc'),
    })
    .refine((q) => !q.dueFrom || !q.dueTo || q.dueFrom <= q.dueTo, {
      message: 'dueFrom must be on or before dueTo',
      path: ['dueTo'],
    })
);
