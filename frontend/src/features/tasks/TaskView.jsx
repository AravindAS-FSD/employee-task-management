import { Link, useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../../api/tasks.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import DetailRow from '../../components/DetailRow.jsx';
import { OverdueBadge, PriorityBadge } from '../../components/Badges.jsx';
import StatusDropdown from './StatusDropdown.jsx';
import { TERMINAL_STATUSES } from '../../constants.js';
import { formatDate } from '../../utils/format.js';
import { errorMessage } from '../../utils/errors.js';

export default function TaskView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: task, loading, error, refetch } = useFetch(() => tasksApi.get(id), [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${task.taskCode}? This cannot be undone.`)) return;
    try {
      await tasksApi.remove(id);
      toast.show('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  if (loading && !task) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const terminal = TERMINAL_STATUSES.includes(task.status);

  return (
    <>
      <PageHeader title={task.title} subtitle={task.taskCode}>
        {terminal ? (
          <button className="btn btn-secondary" disabled>
            Edit
          </button>
        ) : (
          <Link to={`/tasks/${id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
        )}
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Description</h2>
          <p className="whitespace-pre-line text-sm text-slate-700">{task.description || 'No description provided.'}</p>
        </section>

        <aside className="card p-6">
          <dl className="space-y-4">
            <DetailRow label="Status">
              <StatusDropdown task={task} onChanged={refetch} />
            </DetailRow>
            <DetailRow label="Priority">
              <PriorityBadge priority={task.priority} />
            </DetailRow>
            <DetailRow label="Department">{task.department}</DetailRow>
            <DetailRow label="Assignee">
              {task.assignee.deleted ? (
                <span className="text-slate-500">
                  {task.assignee.name} <em>(employee removed)</em>
                </span>
              ) : (
                <Link className="link" to={`/employees/${task.assignee.id}`}>
                  {task.assignee.name}
                </Link>
              )}
            </DetailRow>
            <DetailRow label="Start date">{formatDate(task.startDate)}</DetailRow>
            <DetailRow label="Due date">
              <span className="flex items-center gap-2">
                {formatDate(task.dueDate)}
                {task.isOverdue && <OverdueBadge />}
              </span>
            </DetailRow>
            <DetailRow label="Created">{formatDate(task.createdDate)}</DetailRow>
            <DetailRow label="Completed">{task.completedDate ? formatDate(task.completedDate) : '—'}</DetailRow>
          </dl>
        </aside>
      </div>
    </>
  );
}
