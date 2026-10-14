// Pure business rules. No database access here, so these are unit-testable and reusable.
import { TERMINAL_TASK_STATUSES } from '../constants.js';
import { rule } from '../utils/AppError.js';
import { startOfDayUTC } from '../utils/dates.js';

/** The only legal status changes. Anything not listed is rejected. */
export const ALLOWED_TRANSITIONS = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertCanTransition(from, to) {
  if (!canTransition(from, to)) {
    throw rule(`Cannot change status from ${from} to ${to}`, { from, allowed: ALLOWED_TRANSITIONS[from] });
  }
}

export function assertTaskEditable(task) {
  if (TERMINAL_TASK_STATUSES.includes(task.status)) {
    throw rule(`${task.status} tasks cannot be edited`, { status: task.status });
  }
}

export function assertDateOrder(startDate, dueDate) {
  if (dueDate < startDate) {
    throw rule('Due date cannot be earlier than start date', { field: 'dueDate' });
  }
}

/**
 * Inactive: never assignable.
 * On Leave: assignable unless the task's start date falls inside the leave period (both ends inclusive).
 */
export function assertCanAssign(employee, startDate) {
  if (employee.status === 'Inactive') {
    throw rule('Inactive employees cannot be assigned tasks', { field: 'assignedEmployee' });
  }
  if (employee.status === 'On Leave' && startDate >= employee.leaveStart && startDate <= employee.leaveEnd) {
    throw rule('Employee is on leave on this task’s start date', { field: 'assignedEmployee' });
  }
}

export function assertLeaveConsistent({ status, leaveStart, leaveEnd }) {
  if (status === 'On Leave') {
    if (!leaveStart || !leaveEnd) {
      throw rule('Leave start and end dates are required when status is On Leave', { field: 'leaveStart' });
    }
    if (leaveEnd < leaveStart) {
      throw rule('Leave end cannot be earlier than leave start', { field: 'leaveEnd' });
    }
  } else if (leaveStart || leaveEnd) {
    throw rule('Leave dates are only allowed when status is On Leave', { field: 'status' });
  }
}

/** Overdue: today is later than the due date and the task is not Completed or Cancelled. */
export function isOverdue(task, now = new Date()) {
  if (TERMINAL_TASK_STATUSES.includes(task.status)) return false;
  return startOfDayUTC(now) > startOfDayUTC(task.dueDate);
}
