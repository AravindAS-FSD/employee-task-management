// Mirrors the backend enums. The backend is the source of truth; these only drive the UI options.
export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];
export const TASK_STATUS_FILTERS = [...TASK_STATUSES, 'Overdue'];
export const TERMINAL_STATUSES = ['Completed', 'Cancelled'];

// Only these options appear in the status dropdown. The server re-checks every change.
export const NEXT_STATUSES = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};
