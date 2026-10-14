import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeesApi } from '../../api/employees.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FormField from '../../components/FormField.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../../constants.js';
import { validateEmployee } from '../../utils/validation.js';
import { errorMessage, fieldErrorsFrom } from '../../utils/errors.js';
import { toInputDate } from '../../utils/format.js';

const EMPTY_FORM = {
  employeeId: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  joiningDate: '',
  status: 'Active',
  skills: '',
  leaveStart: '',
  leaveEnd: '',
};

const toForm = (e) => ({
  employeeId: e.employeeId,
  fullName: e.fullName,
  email: e.email,
  phone: e.phone,
  department: e.department,
  role: e.role,
  joiningDate: toInputDate(e.joiningDate),
  status: e.status,
  skills: (e.skills ?? []).join(', '),
  leaveStart: toInputDate(e.leaveStart),
  leaveEnd: toInputDate(e.leaveEnd),
});

// Converts form strings to the API shape. Leave dates are sent only for On Leave.
const toPayload = (v) => ({
  employeeId: v.employeeId.trim(),
  fullName: v.fullName.trim(),
  email: v.email.trim(),
  phone: v.phone.trim(),
  department: v.department,
  role: v.role.trim(),
  joiningDate: v.joiningDate,
  status: v.status,
  skills: v.skills.split(',').map((s) => s.trim()).filter(Boolean),
  leaveStart: v.status === 'On Leave' ? v.leaveStart : null,
  leaveEnd: v.status === 'On Leave' ? v.leaveEnd : null,
});

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useFetch(() => (isEdit ? employeesApi.get(id) : Promise.resolve(null)), [id]);

  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing.data) setValues(toForm(existing.data));
  }, [existing.data]);

  if (isEdit && existing.loading && !existing.data) return <LoadingState />;
  if (isEdit && existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />;

  const onLeave = values.status === 'On Leave';
  const inputClass = (name) => `input ${errors[name] ? 'input-error' : ''}`;

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateEmployee(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = toPayload(values);
      const saved = isEdit ? await employeesApi.update(id, payload) : await employeesApi.create(payload);
      toast.show(isEdit ? 'Employee updated' : 'Employee created');
      navigate(`/employees/${saved.id}`);
    } catch (err) {
      // 409 duplicate email/ID is shown under the field, other rule errors in the banner.
      setErrors(fieldErrorsFrom(err));
      setFormError(errorMessage(err));
      toast.show(errorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit employee' : 'Add employee'} />

      <form onSubmit={handleSubmit} noValidate className="card max-w-3xl p-6">
        {formError && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <fieldset disabled={submitting} className="grid gap-4 md:grid-cols-2">
          <FormField label="Employee ID" htmlFor="employeeId" error={errors.employeeId}>
            <input id="employeeId" name="employeeId" className={inputClass('employeeId')} value={values.employeeId} onChange={handleChange} />
          </FormField>
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName}>
            <input id="fullName" name="fullName" className={inputClass('fullName')} value={values.fullName} onChange={handleChange} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email}>
            <input id="email" name="email" type="email" className={inputClass('email')} value={values.email} onChange={handleChange} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone}>
            <input id="phone" name="phone" className={inputClass('phone')} value={values.phone} onChange={handleChange} />
          </FormField>
          <FormField label="Department" htmlFor="department" error={errors.department}>
            <select id="department" name="department" className={inputClass('department')} value={values.department} onChange={handleChange}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Role" htmlFor="role" error={errors.role}>
            <input id="role" name="role" className={inputClass('role')} value={values.role} onChange={handleChange} />
          </FormField>
          <FormField label="Joining date" htmlFor="joiningDate" error={errors.joiningDate}>
            <input id="joiningDate" name="joiningDate" type="date" className={inputClass('joiningDate')} value={values.joiningDate} onChange={handleChange} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status}>
            <select id="status" name="status" className={inputClass('status')} value={values.status} onChange={handleChange}>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>

          {onLeave && (
            <>
              <FormField label="Leave start" htmlFor="leaveStart" error={errors.leaveStart}>
                <input id="leaveStart" name="leaveStart" type="date" className={inputClass('leaveStart')} value={values.leaveStart} onChange={handleChange} />
              </FormField>
              <FormField label="Leave end" htmlFor="leaveEnd" error={errors.leaveEnd}>
                <input id="leaveEnd" name="leaveEnd" type="date" className={inputClass('leaveEnd')} value={values.leaveEnd} min={values.leaveStart} onChange={handleChange} />
              </FormField>
            </>
          )}

          <div className="md:col-span-2">
            <FormField label="Skills" htmlFor="skills" hint="Comma-separated, e.g. React, Node.js, Figma" error={errors.skills}>
              <input id="skills" name="skills" className={inputClass('skills')} value={values.skills} onChange={handleChange} />
            </FormField>
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <Link to={isEdit ? `/employees/${id}` : '/employees'} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </form>
    </>
  );
}
