// Usage: npm run seed   (wipes employees, tasks and counters, then loads sample data through the services)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Employee } from '../models/Employee.js';
import { Task } from '../models/Task.js';
import { Counter } from '../models/Counter.js';
import * as employeeService from '../services/employeeService.js';
import * as taskService from '../services/taskService.js';

const day = (offset) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
};

const people = [
  { employeeId: 'EMP-001', fullName: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98450 11111', department: 'Development', role: 'Backend Engineer', joiningDate: day(-400), skills: ['Node.js', 'MongoDB'] },
  { employeeId: 'EMP-002', fullName: 'Priya Patil', email: 'priya.patil@example.com', phone: '+91 98450 22222', department: 'Design', role: 'UI Designer', joiningDate: day(-300), skills: ['Figma'] },
  { employeeId: 'EMP-003', fullName: 'Amit Joshi', email: 'amit.joshi@example.com', phone: '+91 98450 33333', department: 'QA', role: 'QA Engineer', joiningDate: day(-200), skills: ['Testing'] },
  { employeeId: 'EMP-004', fullName: 'Neha Verma', email: 'neha.verma@example.com', phone: '+91 98450 44444', department: 'HR', role: 'HR Executive', joiningDate: day(-150), status: 'On Leave', leaveStart: day(5), leaveEnd: day(12) },
  { employeeId: 'EMP-005', fullName: 'Karan Mehta', email: 'karan.mehta@example.com', phone: '+91 98450 55555', department: 'Sales', role: 'Sales Lead', joiningDate: day(-600), status: 'Inactive' },
  { employeeId: 'EMP-006', fullName: 'Sara Khan', email: 'sara.khan@example.com', phone: '+91 98450 66666', department: 'Development', role: 'Frontend Engineer', joiningDate: day(-90), skills: ['React'] },
];

const tasks = [
  { title: 'Fix payment API bug', assignee: 'EMP-001', department: 'Development', priority: 'High', startDate: day(-3), dueDate: day(-1), target: 'In Progress' },
  { title: 'Design login screen', assignee: 'EMP-002', department: 'Design', priority: 'Medium', startDate: day(-1), dueDate: day(6), target: 'Todo' },
  { title: 'Write regression tests', assignee: 'EMP-003', department: 'QA', priority: 'Low', startDate: day(-10), dueDate: day(-5), target: 'Completed' },
  { title: 'Update landing page', assignee: 'EMP-002', department: 'Design', priority: 'Critical', startDate: day(-2), dueDate: day(12), target: 'Cancelled' },
  { title: 'Setup CI pipeline', assignee: 'EMP-001', department: 'Development', priority: 'High', startDate: day(0), dueDate: day(4), target: 'Todo' },
  { title: 'Prepare onboarding handbook', assignee: 'EMP-004', department: 'HR', priority: 'Medium', startDate: day(-2), dueDate: day(20), target: 'Todo' },
  { title: 'Build product search page', assignee: 'EMP-006', department: 'Development', priority: 'Critical', startDate: day(-1), dueDate: day(9), target: 'In Progress' },
];

// The status path each target needs. Completed must go through In Progress.
const PATHS = { Todo: [], 'In Progress': ['In Progress'], Completed: ['In Progress', 'Completed'], Cancelled: ['Cancelled'] };

await connectDB(process.env.MONGODB_URI);
await Promise.all([Employee.deleteMany({}), Task.deleteMany({}), Counter.deleteMany({})]);

const byCode = {};
for (const p of people) {
  const created = await employeeService.createEmployee(p);
  byCode[p.employeeId] = created.id;
}

for (const t of tasks) {
  const created = await taskService.createTask({
    title: t.title,
    description: '',
    assignedEmployee: byCode[t.assignee],
    department: t.department,
    priority: t.priority,
    startDate: t.startDate,
    dueDate: t.dueDate,
  });
  for (const next of PATHS[t.target]) await taskService.changeStatus(created.id, next);
}

console.log(`Seeded ${people.length} employees and ${tasks.length} tasks`);
await mongoose.disconnect();
