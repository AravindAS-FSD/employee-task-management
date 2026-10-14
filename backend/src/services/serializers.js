import { isOverdue } from '../domain/rules.js';

export function serializeEmployee(e) {
  return {
    id: String(e._id),
    employeeId: e.employeeId,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone,
    department: e.department,
    role: e.role,
    joiningDate: e.joiningDate,
    status: e.status,
    skills: e.skills,
    leaveStart: e.leaveStart,
    leaveEnd: e.leaveEnd,
    activeTaskCount: e.activeTaskCount,
  };
}

export function employeeSnapshot(e) {
  return { code: e.employeeId, name: e.fullName, email: e.email, department: e.department, deleted: false };
}

export function serializeTask(t, now = new Date()) {
  return {
    id: String(t._id),
    taskCode: t.taskCode,
    title: t.title,
    description: t.description,
    department: t.department,
    priority: t.priority,
    status: t.status,
    assignee: {
      id: t.employee ? String(t.employee) : null,
      code: t.assignee?.code ?? null,
      name: t.assignee?.name ?? null,
      email: t.assignee?.email ?? null,
      department: t.assignee?.department ?? null,
      deleted: Boolean(t.assignee?.deleted),
    },
    startDate: t.startDate,
    dueDate: t.dueDate,
    createdDate: t.createdDate,
    completedDate: t.completedDate,
    isOverdue: isOverdue(t, now),
  };
}
