import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeesApi } from '../../api/employees.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import DetailRow from '../../components/DetailRow.jsx';
import { EmployeeStatusBadge } from '../../components/Badges.jsx';
import { formatDate } from '../../utils/format.js';
import { errorMessage } from '../../utils/errors.js';

export default function EmployeeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: employee, loading, error, refetch } = useFetch(() => employeesApi.get(id), [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${employee.fullName}?`)) return;
    try {
      await employeesApi.remove(id);
      toast.show('Employee deleted');
      navigate('/employees');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  if (loading && !employee) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader title={employee.fullName} subtitle={`${employee.role} · ${employee.department}`}>
        <Link to={`/tasks?employee=${id}`} className="btn btn-secondary">
          View tasks ({employee.activeTaskCount} active)
        </Link>
        <Link to={`/employees/${id}/edit`} className="btn btn-secondary">
          Edit
        </Link>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Employee ID">{employee.employeeId}</DetailRow>
            <DetailRow label="Status">
              <EmployeeStatusBadge status={employee.status} />
            </DetailRow>
            <DetailRow label="Email">{employee.email}</DetailRow>
            <DetailRow label="Phone">{employee.phone}</DetailRow>
            <DetailRow label="Department">{employee.department}</DetailRow>
            <DetailRow label="Role">{employee.role}</DetailRow>
            <DetailRow label="Joining date">{formatDate(employee.joiningDate)}</DetailRow>
            {employee.status === 'On Leave' && (
              <DetailRow label="Leave period">
                {formatDate(employee.leaveStart)} – {formatDate(employee.leaveEnd)}
              </DetailRow>
            )}
          </dl>
        </section>

        <aside className="card p-6">
          <h2 className="mb-3 font-semibold">Skills</h2>
          {employee.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No skills listed.</p>
          )}
        </aside>
      </div>
    </>
  );
}
