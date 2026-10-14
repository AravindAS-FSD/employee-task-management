// Turns validated query params into a Mongo filter and sort. Shared by the list and CSV export,
// so the export always matches exactly what the list shows.
import { ACTIVE_TASK_STATUSES } from '../constants.js';
import { startOfDayUTC } from '../utils/dates.js';
import { escapeRegex } from '../utils/strings.js';

export const COLLATION = { locale: 'en', strength: 2 };

const SORT_FIELDS = { createdDate: 'createdDate', dueDate: 'dueDate', priority: 'priorityRank', title: 'title' };

export function buildTaskFilter(q, now = new Date()) {
  const and = [];

  if (q.status === 'Overdue') {
    and.push({ status: { $in: ACTIVE_TASK_STATUSES } }, { dueDate: { $lt: startOfDayUTC(now) } });
  } else if (q.status) {
    and.push({ status: q.status });
  }

  if (q.department) and.push({ department: q.department });
  if (q.priority) and.push({ priority: q.priority });
  if (q.employee) and.push({ employee: q.employee });
  if (q.dueFrom) and.push({ dueDate: { $gte: q.dueFrom } });
  if (q.dueTo) and.push({ dueDate: { $lte: q.dueTo } });

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    // assignee.name is the snapshot, which is kept in sync on employee updates, so no join is needed.
    and.push({ $or: [{ title: rx }, { 'assignee.name': rx }] });
  }

  return and.length ? { $and: and } : {};
}

export function buildSort(q) {
  const dir = q.order === 'asc' ? 1 : -1;
  return { [SORT_FIELDS[q.sort]]: dir, _id: dir };
}
