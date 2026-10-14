import { Task } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { nextSequence } from '../models/Counter.js';
import { ACTIVE_TASK_STATUSES, MAX_ACTIVE_TASKS, PRIORITY_RANK } from '../constants.js';
import {
  assertCanAssign,
  assertCanTransition,
  assertDateOrder,
  assertTaskEditable,
  isOverdue,
} from '../domain/rules.js';
import { AppError, notFound, rule } from '../utils/AppError.js';
import { toCsv } from '../utils/csv.js';
import { toDateOnlyString } from '../utils/dates.js';
import { paginationMeta } from '../utils/pagination.js';
import { serializeTask, employeeSnapshot } from './serializers.js';
import { findEmployeeOrFail } from './employeeService.js';
import { buildSort, buildTaskFilter, COLLATION } from './taskQuery.js';

const MAX_EXPORT_ROWS = 5000;
const isActive = (status) => ACTIVE_TASK_STATUSES.includes(status);

async function findTaskOrFail(id) {
  const task = await Task.findById(id);
  if (!task) throw notFound('Task');
  return task;
}

/**
 * Atomically takes one of the employee's active-task slots.
 * The filter re-checks capacity and status inside the write, so two concurrent requests
 * cannot both take the 3rd slot. This is the answer to README question (6).
 */
async function reserveSlot(employee) {
  const reserved = await Employee.findOneAndUpdate(
    { _id: employee._id, status: employee.status, activeTaskCount: { $lt: MAX_ACTIVE_TASKS } },
    { $inc: { activeTaskCount: 1 } },
    { new: true }
  );
  if (reserved) return;

  // Nothing matched: work out why, so the user gets an accurate message.
  const fresh = await Employee.findById(employee._id).lean();
  if (!fresh) throw notFound('Employee');
  if (fresh.activeTaskCount >= MAX_ACTIVE_TASKS) {
    throw rule(`Employee already has ${MAX_ACTIVE_TASKS} active tasks. Please choose another employee.`, {
      field: 'assignedEmployee',
    });
  }
  throw new AppError(409, 'Employee availability changed. Please try again.', { code: 'CONFLICT' });
}

async function releaseSlot(employeeId) {
  await Employee.updateOne({ _id: employeeId, activeTaskCount: { $gt: 0 } }, { $inc: { activeTaskCount: -1 } });
}

export async function listTasks(query) {
  const now = new Date();
  const filter = buildTaskFilter(query, now);
  const skip = (query.page - 1) * query.limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(buildSort(query)).collation(COLLATION).skip(skip).limit(query.limit).lean(),
    Task.countDocuments(filter),
  ]);
  return { items: tasks.map((t) => serializeTask(t, now)), meta: paginationMeta(query, total) };
}

export async function getTask(id) {
  return serializeTask(await findTaskOrFail(id));
}

export async function createTask(input) {
  assertDateOrder(input.startDate, input.dueDate);
  const employee = await findEmployeeOrFail(input.assignedEmployee);
  assertCanAssign(employee, input.startDate);
  await reserveSlot(employee);

  try {
    const seq = await nextSequence('task');
    const task = await Task.create({
      taskCode: `TSK-${String(seq).padStart(3, '0')}`,
      title: input.title,
      description: input.description ?? '',
      employee: employee._id,
      assignee: employeeSnapshot(employee),
      department: input.department,
      priority: input.priority,
      priorityRank: PRIORITY_RANK[input.priority],
      status: 'Todo', // new tasks always start as Todo
      startDate: input.startDate,
      dueDate: input.dueDate,
      createdDate: new Date(),
    });
    return serializeTask(task);
  } catch (err) {
    await releaseSlot(employee._id); // roll back the reservation if the insert failed
    throw err;
  }
}

/** Generic edit. Status is not in the schema, so it cannot change here. */
export async function updateTask(id, input) {
  const task = await findTaskOrFail(id);
  assertTaskEditable(task);

  const startDate = input.startDate ?? task.startDate;
  const dueDate = input.dueDate ?? task.dueDate;
  assertDateOrder(startDate, dueDate);

  const { assignedEmployee, ...fields } = input;
  const reassigned = Boolean(assignedEmployee) && assignedEmployee !== String(task.employee);
  const datesChanged = startDate.getTime() !== task.startDate.getTime();

  let target = null;
  if (reassigned || datesChanged) {
    target = await findEmployeeOrFail(reassigned ? assignedEmployee : task.employee);
    assertCanAssign(target, startDate);
  }
  if (reassigned) await reserveSlot(target);

  const update = {
    ...fields,
    startDate,
    dueDate,
    priorityRank: PRIORITY_RANK[fields.priority ?? task.priority],
  };
  if (reassigned) {
    update.employee = target._id;
    update.assignee = employeeSnapshot(target);
  }

  let updated;
  try {
    updated = await Task.findOneAndUpdate({ _id: task._id, status: task.status }, { $set: update }, { new: true });
  } catch (err) {
    if (reassigned) await releaseSlot(target._id);
    throw err;
  }
  if (!updated) {
    if (reassigned) await releaseSlot(target._id);
    throw new AppError(409, 'This task was changed by another request. Please reload.', { code: 'CONFLICT' });
  }
  if (reassigned) await releaseSlot(task.employee); // free the old employee's slot
  return serializeTask(updated);
}

/** The only path that changes status. Completed Date is set here, never taken from the client. */
export async function changeStatus(id, next) {
  const task = await findTaskOrFail(id);
  const from = task.status;
  assertCanTransition(from, next);

  const set = { status: next };
  if (next === 'Completed') set.completedDate = new Date();

  // Guarded on the current status, so two concurrent transitions cannot both succeed.
  const updated = await Task.findOneAndUpdate({ _id: task._id, status: from }, { $set: set }, { new: true });
  if (!updated) throw new AppError(409, 'Task status changed by another request. Please reload.', { code: 'CONFLICT' });

  if (isActive(from) && !isActive(next) && task.employee) {
    await releaseSlot(task.employee);
  }
  return serializeTask(updated);
}

export async function deleteTask(id) {
  const task = await findTaskOrFail(id);
  await Task.deleteOne({ _id: task._id });
  if (isActive(task.status) && task.employee) await releaseSlot(task.employee);
}

const d = (value) => (value ? toDateOnlyString(value) : '');

const TASK_CSV_COLUMNS = [
  { header: 'Task ID', value: (t) => t.taskCode },
  { header: 'Title', value: (t) => t.title },
  { header: 'Employee', value: (t) => t.assignee.name },
  { header: 'Employee ID', value: (t) => t.assignee.code },
  { header: 'Department', value: (t) => t.department },
  { header: 'Priority', value: (t) => t.priority },
  { header: 'Status', value: (t) => t.status },
  { header: 'Start Date', value: (t) => d(t.startDate) },
  { header: 'Due Date', value: (t) => d(t.dueDate) },
  { header: 'Created Date', value: (t) => d(t.createdDate) },
  { header: 'Completed Date', value: (t) => d(t.completedDate) },
  { header: 'Overdue', value: (t) => (t.isOverdue ? 'Yes' : 'No') },
];

/** Exports every task matching the filters (not just one page). */
export async function exportTasksCsv(query) {
  const now = new Date();
  const filter = buildTaskFilter(query, now);

  const total = await Task.countDocuments(filter);
  if (total > MAX_EXPORT_ROWS) {
    throw new AppError(400, `Export is limited to ${MAX_EXPORT_ROWS} tasks. Narrow the filters and try again.`, {
      code: 'EXPORT_LIMIT_EXCEEDED',
      details: { total, limit: MAX_EXPORT_ROWS },
    });
  }

  const tasks = await Task.find(filter).sort(buildSort(query)).collation(COLLATION).lean();
  return toCsv(
    tasks.map((t) => serializeTask(t, now)),
    TASK_CSV_COLUMNS
  );
}
