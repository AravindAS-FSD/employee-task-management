import mongoose from 'mongoose';
import { DEPARTMENTS, PRIORITIES, TASK_STATUSES } from '../constants.js';

const taskSchema = new mongoose.Schema(
  {
    taskCode: { type: String, required: true, unique: true }, // TSK-001, auto-generated
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    // Live link to the assignee. Set to null when the employee is deleted (only allowed with no active tasks).
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
    // Snapshot of the assignee, so history still reads correctly after the employee is gone.
    assignee: {
      code: String,
      name: String,
      email: String,
      department: String,
      deleted: { type: Boolean, default: false },
    },
    department: { type: String, enum: DEPARTMENTS, required: true },
    priority: { type: String, enum: PRIORITIES, required: true },
    priorityRank: { type: Number, required: true }, // Low=1 .. Critical=4, so sorting is by importance
    status: { type: String, enum: TASK_STATUSES, default: 'Todo', index: true },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    createdDate: { type: Date, default: Date.now },
    completedDate: { type: Date, default: null }, // set only by taskService.changeStatus
  },
  { timestamps: true }
);

taskSchema.index({ employee: 1, status: 1 });

export const Task = mongoose.model('Task', taskSchema);
