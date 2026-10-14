import { Link } from 'react-router-dom';
import { employeesApi } from '../../api/employees.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useListParams } from '../../hooks/useListParams.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Table from '../../components/Table.jsx';
import Pagination from '../../components/Pagination.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { EmployeeStatusBadge } from '../../components/Badges.jsx';
import EmployeeFilters from './EmployeeFilters.jsx';
import { errorMessage } from '../../utils/errors.js';

export default function EmployeeList() {
  const { params, query, update } = useListParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(
    () => employeesApi.list(Object.fromEntries(new URLSearchParams(query))),
    [query]
  );

  async function handleDelete(employee) {
    if (!window.confirm(`Delete ${employee.fullName}?`)) return;
    try {
      await employeesApi.remove(employee.id);
      toast.show('Employee deleted');
      refetch();
    } catch (err) {
      // Usually "has Todo / In Progress tasks". The server's message explains why.
      toast.show(errorMessage(err), 'error');
    }
  }

  const columns = [
    { header: 'ID', render: (e) => <span className="font-mono text-xs">{e.employeeId}</span> },
    {
      header: 'Name',
      render: (e) => (
        <Link className="link font-medium" to={`/employees/${e.id}`}>
          {e.fullName}
        </Link>
      ),
    },
    { header: 'Email', render: (e) => e.email },
    { header: 'Department', render: (e) => e.department },
    { header: 'Role', render: (e) => e.role },
    { header: 'Status', render: (e) => <EmployeeStatusBadge status={e.status} /> },
    { header: 'Active tasks', className: 'text-center', render: (e) => e.activeTaskCount },
    {
      header: 'Actions',
      className: 'text-right',
      render: (e) => (
        <div className="flex justify-end gap-3 whitespace-nowrap">
          <Link className="link" to={`/employees/${e.id}`}>
            View
          </Link>
          <Link className="link" to={`/employees/${e.id}/edit`}>
            Edit
          </Link>
          <button className="text-red-600 hover:underline" onClick={() => handleDelete(e)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Employees" subtitle="Filters, sorting and page number are kept in the URL">
        <Link to="/employees/new" className="btn btn-primary">
          + Add employee
        </Link>
      </PageHeader>

      <EmployeeFilters params={params} update={update} />

      {!data && loading && <LoadingState />}
      {error && !data && <ErrorState error={error} onRetry={refetch} />}

      {data && (
        <div className={loading ? 'opacity-60 transition' : ''} aria-busy={loading}>
          <Table columns={columns} rows={data.data} rowKey={(e) => e.id} emptyMessage="No employees match these filters." />
          <Pagination meta={data.meta} onPageChange={(page) => update({ page }, { keepPage: true })} />
        </div>
      )}
    </>
  );
}
