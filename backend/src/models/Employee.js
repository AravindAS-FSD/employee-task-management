import mongoose from 'mongoose';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../constants.js';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    role: { type: String, required: true, trim: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: 'Active' },
    skills: { type: [String], default: [] },
    leaveStart: { type: Date, default: null },
    leaveEnd: { type: Date, default: null },
    // Number of Todo + In Progress tasks. Changed only with atomic $inc, see taskService.reserveSlot.
    activeTaskCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', employeeSchema);
