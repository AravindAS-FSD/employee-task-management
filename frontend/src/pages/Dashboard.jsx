import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.js';
import { useFetch } from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { EmployeeStatusBadge } from '../components/Badges.jsx';

function StatCard({ label, value, tone = 'text-slate-900', to }) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
    </>
  );
  return to ? (
    <Link to={to} className="card block p-4 transition hover:shadow-md">
      {content}
    </Link>
  ) : (
    <div className="card p-4">{content}</div>
  );
}

export default function Dashboard() {
  // All numbers are calculated on the server.
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.get(), []);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { employees, tasks, workload } = data;

  const workloadColumns = [
    {
      header: 'Employee',
      render: (r) => (
        <Link className="link font-medium" to={`/employees/${r.id}`}>
          {r.fullName}
        </Link>
      ),
    },
    { header: 'Department', render: (r) => r.department },
    { header: 'Status', render: (r) => <EmployeeStatusBadge status={r.status} /> },
    { header: 'Active tasks', className: 'text-center', render: (r) => r.activeTasks },
    {
      header: 'Overdue',
      className: 'text-center',
      render: (r) => <span className={r.overdueTasks > 0 ? 'font-semibold text-red-600' : ''}>{r.overdueTasks}</span>,
    },
    {
      header: '',
      className: 'text-right',
      render: (r) => (
        <Link className="link" to={`/tasks?employee=${r.id}`}>
          View tasks
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="All numbers come from the server">
        <button className="btn btn-secondary" onClick={refetch}>
          Refresh
        </button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total employees" value={employees.total} to="/employees" />
        <StatCard label="Active" value={employees.byStatus.Active} tone="text-emerald-700" to="/employees?status=Active" />
        <StatCard label="Inactive" value={employees.byStatus.Inactive} tone="text-slate-500" to="/employees?status=Inactive" />
        <StatCard label="On leave" value={employees.byStatus['On Leave']} tone="text-amber-700" to="/employees?status=On%20Leave" />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total tasks" value={tasks.total} to="/tasks" />
        <StatCard label="Todo" value={tasks.byStatus.Todo} tone="text-slate-600" to="/tasks?status=Todo" />
        <StatCard label="In progress" value={tasks.byStatus['In Progress']} tone="text-blue-700" to="/tasks?status=In%20Progress" />
        <StatCard label="Completed" value={tasks.byStatus.Completed} tone="text-emerald-700" to="/tasks?status=Completed" />
        <StatCard label="Cancelled" value={tasks.byStatus.Cancelled} tone="text-orange-700" to="/tasks?status=Cancelled" />
        <StatCard label="Overdue" value={tasks.overdue} tone="text-red-600" to="/tasks?status=Overdue" />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Employee workload</h2>
        <Table columns={workloadColumns} rows={workload} rowKey={(r) => r.id} emptyMessage="No employees yet." />
      </section>
    </>
  );
}
