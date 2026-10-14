// Client-side checks for fast feedback. The backend repeats them and is the final authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 -]{6,18}$/;
const EMPLOYEE_ID_RE = /^[A-Za-z0-9-]{3,20}$/;
const NAME_RE = /^[\p{L}][\p{L} .'-]*$/u;

export function validateEmployee(v) {
  const errors = {};
  const set = (key, message) => {
    if (message) errors[key] = message;
  };

  const name = v.fullName.trim();
  set('employeeId', !EMPLOYEE_ID_RE.test(v.employeeId.trim()) && '3–20 letters, digits or hyphens');
  set('fullName', (name.length < 2 || !NAME_RE.test(name)) && 'Enter a valid name (at least 2 letters)');
  set('email', !EMAIL_RE.test(v.email.trim()) && 'Enter a valid email address');
  set('phone', !PHONE_RE.test(v.phone.trim()) && 'Enter a valid phone number');
  set('role', v.role.trim().length < 2 && 'Enter a role');
  set('department', !v.department && 'Select a department');
  set('joiningDate', !v.joiningDate && 'Joining date is required');

  if (v.status === 'On Leave') {
    set('leaveStart', !v.leaveStart && 'Leave start is required');
    set('leaveEnd', !v.leaveEnd && 'Leave end is required');
    if (v.leaveStart && v.leaveEnd && v.leaveEnd < v.leaveStart) {
      set('leaveEnd', 'Leave end must be on or after leave start');
    }
  }
  return errors;
}

export function validateTask(v) {
  const errors = {};
  const set = (key, message) => {
    if (message) errors[key] = message;
  };
  const title = v.title.trim();

  set('title', (title.length < 3 || title.length > 120) && 'Title must be 3–120 characters');
  set('assignedEmployee', !v.assignedEmployee && 'Select an employee');
  set('department', !v.department && 'Select a department');
  set('priority', !v.priority && 'Select a priority');
  set('startDate', !v.startDate && 'Start date is required');
  set('dueDate', !v.dueDate && 'Due date is required');
  if (v.startDate && v.dueDate && v.dueDate < v.startDate) {
    set('dueDate', 'Due date cannot be earlier than start date');
  }
  set('description', v.description.length > 2000 && 'Description is too long (max 2000 characters)');
  return errors;
}
