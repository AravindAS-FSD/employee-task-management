const TASK_TONES = {
  Todo: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-orange-100 text-orange-800',
};

const PRIORITY_TONES = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-amber-100 text-amber-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

const EMPLOYEE_TONES = {
  Active: 'bg-emerald-100 text-emerald-800',
  Inactive: 'bg-slate-200 text-slate-700',
  'On Leave': 'bg-amber-100 text-amber-800',
};

function Badge({ tone, children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

export const TaskStatusBadge = ({ status }) => <Badge tone={TASK_TONES[status]}>{status}</Badge>;
export const PriorityBadge = ({ priority }) => <Badge tone={PRIORITY_TONES[priority]}>{priority}</Badge>;
export const EmployeeStatusBadge = ({ status }) => <Badge tone={EMPLOYEE_TONES[status]}>{status}</Badge>;
export const OverdueBadge = () => <Badge tone="bg-red-600 text-white">Overdue</Badge>;
