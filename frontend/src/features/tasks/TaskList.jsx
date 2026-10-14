import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../../api/tasks.js';
import { downloadCsv } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useListParams } from '../../hooks/useListParams.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Table from '../../components/Table.jsx';
import Pagination from '../../components/Pagination.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { OverdueBadge, PriorityBadge } from '../../components/Badges.jsx';
import TaskFilters from './TaskFilters.jsx';
import StatusDropdown from './StatusDropdown.jsx';
import { TERMINAL_STATUSES } from '../../constants.js';
import { formatDate } from '../../utils/format.js';
import { errorMessage } from '../../utils/errors.js';

export default function TaskList() {
  const { params, query, update } = useListParams();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  // Fetch depends only on the URL, so the server applies the same filters the user sees.
  const { data, loading, error, refetch } = useFetch(
    () => tasksApi.list(Object.fromEntries(new URLSearchParams(query))),
    [query]
  );

  async function handleExport() {
    // Export uses the same filters but no paging, so it returns every matching task.
    const { page, limit, ...filters } = Object.fromEntries(new URLSearchParams(query));
    setExporting(true);
    try {
      await downloadCsv('/tasks/export.csv', filters);
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete ${task.taskCode}? This cannot be undone.`)) return;
    try {
      await tasksApi.remove(task.id);
      toast.show('Task deleted');
      refetch();
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const columns = [
    { header: 'ID', render: (t) => <span className="font-mono text-xs">{t.taskCode}</span> },
    {
      header: 'Title',
      render: (t) => (
        <Link className="link font-medium" to={`/tasks/${t.id}`}>
          {t.title}
        </Link>
      ),
    },
    {
      header: 'Employee',
      render: (t) =>
        t.assignee.deleted ? (
          <span className="text-slate-500">
            {t.assignee.name} <em>(removed)</em>
          </span>
        ) : (
          <Link className="link" to={`/employees/${t.assignee.id}`}>
            {t.assignee.name}
          </Link>
        ),
    },
    { header: 'Priority', render: (t) => <PriorityBadge priority={t.priority} /> },
    { header: 'Status', render: (t) => <StatusDropdown task={t} onChanged={refetch} /> },
    {
      header: 'Due',
      render: (t) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          {formatDate(t.dueDate)}
          {t.isOverdue && <OverdueBadge />}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-3 whitespace-nowrap">
          <Link className="link" to={`/tasks/${t.id}`}>
            View
          </Link>
          {TERMINAL_STATUSES.includes(t.status) ? (
            <span className="text-slate-400">Edit</span>
          ) : (
            <Link className="link" to={`/tasks/${t.id}/edit`}>
              Edit
            </Link>
          )}
          <button className="text-red-600 hover:underline" onClick={() => handleDelete(t)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Tasks" subtitle="Filters, sorting and page number are kept in the URL">
        <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
        <Link to="/tasks/new" className="btn btn-primary">
          + Add task
        </Link>
      </PageHeader>

      <TaskFilters params={params} update={update} />

      {!data && loading && <LoadingState />}
      {error && !data && <ErrorState error={error} onRetry={refetch} />}

      {data && (
        <div className={loading ? 'opacity-60 transition' : ''} aria-busy={loading}>
          <Table columns={columns} rows={data.data} rowKey={(t) => t.id} emptyMessage="No tasks match these filters." />
          <Pagination meta={data.meta} onPageChange={(page) => update({ page }, { keepPage: true })} />
        </div>
      )}
    </>
  );
}
