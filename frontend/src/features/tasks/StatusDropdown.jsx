import { useState } from 'react';
import { tasksApi } from '../../api/tasks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { TaskStatusBadge } from '../../components/Badges.jsx';
import { NEXT_STATUSES } from '../../constants.js';
import { errorMessage } from '../../utils/errors.js';

/** Shows only the statuses the rules allow next. Terminal statuses render as a plain badge. */
export default function StatusDropdown({ task, onChanged }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const nextStatuses = NEXT_STATUSES[task.status] ?? [];

  if (nextStatuses.length === 0) return <TaskStatusBadge status={task.status} />;

  async function handleChange(e) {
    const status = e.target.value;
    if (status === 'Cancelled' && !window.confirm(`Cancel ${task.taskCode}? A cancelled task cannot be reopened.`)) {
      return;
    }
    setSaving(true);
    try {
      await tasksApi.changeStatus(task.id, status);
      toast.show(`${task.taskCode} is now ${status}`);
      onChanged?.();
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      aria-label={`Status of ${task.taskCode}`}
      className="input w-auto py-1 text-xs"
      value={task.status}
      disabled={saving}
      onChange={handleChange}
    >
      <option value={task.status}>{task.status}</option>
      {nextStatuses.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
