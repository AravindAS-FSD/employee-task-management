import { Employee } from '../models/Employee.js';
import { Task } from '../models/Task.js';
import { ACTIVE_TASK_STATUSES, EMPLOYEE_STATUSES, TASK_STATUSES } from '../constants.js';
import { startOfDayUTC } from '../utils/dates.js';

const countBy = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

export async function getDashboard(now = new Date()) {
  const today = startOfDayUTC(now);

  const [employeeRows, taskRows, overdue, workloadRows, employees] = await Promise.all([
    Employee.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Same rule as isOverdue(): due before today and not Completed or Cancelled
    Task.countDocuments({ status: { $in: ACTIVE_TASK_STATUSES }, dueDate: { $lt: today } }),
    Task.aggregate([
      { $match: { status: { $in: ACTIVE_TASK_STATUSES }, employee: { $ne: null } } },
      {
        $group: {
          _id: '$employee',
          activeTasks: { $sum: 1 },
          overdueTasks: { $sum: { $cond: [{ $lt: ['$dueDate', today] }, 1, 0] } },
        },
      },
    ]),
    Employee.find({}, 'fullName employeeId department status').lean(),
  ]);

  const employeeCounts = countBy(employeeRows);
  const taskCounts = countBy(taskRows);
  const workloadById = new Map(workloadRows.map((r) => [String(r._id), r]));

  const workload = employees
    .map((e) => {
      const w = workloadById.get(String(e._id));
      return {
        id: String(e._id),
        employeeId: e.employeeId,
        fullName: e.fullName,
        department: e.department,
        status: e.status,
        activeTasks: w?.activeTasks ?? 0,
        overdueTasks: w?.overdueTasks ?? 0,
      };
    })
    .sort((a, b) => b.activeTasks - a.activeTasks || a.fullName.localeCompare(b.fullName));

  const employeesByStatus = Object.fromEntries(EMPLOYEE_STATUSES.map((s) => [s, employeeCounts[s] ?? 0]));
  const tasksByStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, taskCounts[s] ?? 0]));

  return {
    employees: { total: sum(employeesByStatus), byStatus: employeesByStatus },
    tasks: { total: sum(tasksByStatus), byStatus: tasksByStatus, overdue },
    workload,
  };
}
