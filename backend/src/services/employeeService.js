import { Employee } from '../models/Employee.js';
import { Task } from '../models/Task.js';
import { ACTIVE_TASK_STATUSES } from '../constants.js';
import { assertLeaveConsistent } from '../domain/rules.js';
import { rule, notFound } from '../utils/AppError.js';
import { escapeRegex } from '../utils/strings.js';
import { paginationMeta } from '../utils/pagination.js';
import { serializeEmployee, employeeSnapshot } from './serializers.js';

const SORT_FIELDS = { fullName: 'fullName', joiningDate: 'joiningDate', employeeId: 'employeeId' };

export async function findEmployeeOrFail(id) {
  const employee = await Employee.findById(id);
  if (!employee) throw notFound('Employee');
  return employee;
}

export async function listEmployees(query) {
  const filter = {};
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }, { employeeId: rx }];
  }
  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;

  const dir = query.order === 'desc' ? -1 : 1;
  const skip = (query.page - 1) * query.limit;
  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .sort({ [SORT_FIELDS[query.sort]]: dir, _id: 1 })
      .collation({ locale: 'en', strength: 2 })
      .skip(skip)
      .limit(query.limit),
    Employee.countDocuments(filter),
  ]);
  return { items: employees.map(serializeEmployee), meta: paginationMeta(query, total) };
}

export async function getEmployee(id) {
  return serializeEmployee(await findEmployeeOrFail(id));
}

export async function createEmployee(input) {
  const doc = {
    ...input,
    status: input.status ?? 'Active',
    skills: input.skills ?? [],
    leaveStart: input.leaveStart ?? null,
    leaveEnd: input.leaveEnd ?? null,
  };
  assertLeaveConsistent(doc);
  // Duplicate employeeId/email is caught by the unique indexes and mapped to 409 in errorHandler.
  const employee = await Employee.create(doc);
  return serializeEmployee(employee);
}

export async function updateEmployee(id, input) {
  const employee = await findEmployeeOrFail(id);

  const status = input.status ?? employee.status;
  const leaveTouched = input.leaveStart !== undefined || input.leaveEnd !== undefined;
  let leaveStart = input.leaveStart !== undefined ? input.leaveStart : employee.leaveStart;
  let leaveEnd = input.leaveEnd !== undefined ? input.leaveEnd : employee.leaveEnd;

  // Moving away from On Leave clears the old leave period, unless the caller sent new leave dates.
  if (status !== 'On Leave' && !leaveTouched) {
    leaveStart = null;
    leaveEnd = null;
  }
  assertLeaveConsistent({ status, leaveStart, leaveEnd });

  const updated = await Employee.findByIdAndUpdate(
    employee._id,
    { $set: { ...input, status, leaveStart: leaveStart ?? null, leaveEnd: leaveEnd ?? null } },
    { new: true, runValidators: true }
  );
  if (!updated) throw notFound('Employee');

  // Keep the assignee snapshot on this employee's tasks current (name, email, department).
  await Task.updateMany({ employee: updated._id }, { $set: { assignee: employeeSnapshot(updated) } });
  return serializeEmployee(updated);
}

export async function deleteEmployee(id) {
  const employee = await findEmployeeOrFail(id);

  // Atomic guard: the delete only succeeds while the counter is 0. A concurrent task
  // assignment bumps the counter first, so it cannot slip in between a check and a delete.
  const removed = await Employee.findOneAndDelete({ _id: employee._id, activeTaskCount: 0 });
  if (!removed) {
    const activeTasks = await Task.countDocuments({
      employee: employee._id,
      status: { $in: ACTIVE_TASK_STATUSES },
    });
    throw rule('Cannot delete an employee who has Todo or In Progress tasks', { activeTasks });
  }

  // Past tasks keep their snapshot, so history still shows who did the work.
  await Task.updateMany({ employee: employee._id }, { $set: { employee: null, 'assignee.deleted': true } });
}
