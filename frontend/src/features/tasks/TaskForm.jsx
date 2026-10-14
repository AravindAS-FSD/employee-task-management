import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../../api/tasks.js';
import { employeesApi } from '../../api/employees.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FormField from '../../components/FormField.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { DEPARTMENTS, PRIORITIES, TERMINAL_STATUSES } from '../../constants.js';
import { validateTask } from '../../utils/validation.js';
import { errorMessage, fieldErrorsFrom } from '../../utils/errors.js';
import { toInputDate } from '../../utils/format.js';

const EMPTY_FORM = {
  title: '',
  description: '',
  assignedEmployee: '',
  department: '',
  priority: '',
  startDate: '',
  dueDate: '',
};

const toForm = (task) => ({
  title: task.title,
  description: task.description ?? '',
  assignedEmployee: task.assignee.id ?? '',
  department: task.department,
  priority: task.priority,
  startDate: toInputDate(task.startDate),
  dueDate: toInputDate(task.dueDate),
});

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useFetch(() => (isEdit ? tasksApi.get(id) : Promise.resolve(null)), [id]);
  const employees = useFetch(() => employeesApi.list({ sort: 'fullName', limit: 100 }), []);

  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing.data) setValues(toForm(existing.data));
  }, [existing.data]);

  if (isEdit && existing.loading && !existing.data) return <LoadingState />;
  if (isEdit && existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />;

  const locked = isEdit && existing.data && TERMINAL_STATUSES.includes(existing.data.status);
  const employeeOptions = employees.data?.data ?? [];

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateTask(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    const payload = { ...values, title: values.title.trim(), description: values.description.trim() };
    setSubmitting(true);
    try {
      const saved = isEdit ? await tasksApi.update(id, payload) : await tasksApi.create(payload);
      toast.show(isEdit ? 'Task updated' : 'Task created');
      navigate(`/tasks/${saved.id}`);
    } catch (err) {
      // Business-rule errors (e.g. "3 active tasks") are shown under the field and in a banner.
      setErrors(fieldErrorsFrom(err));
      setFormError(errorMessage(err));
      toast.show(errorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (name) => `input ${errors[name] ? 'input-error' : ''}`;

  return (
    <>
      <PageHeader title={isEdit ? 'Edit task' : 'Add task'} />

      <form onSubmit={handleSubmit} noValidate className="card max-w-3xl p-6">
        {locked && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This task is {existing.data.status} and can no longer be edited.
          </div>
        )}
        {formError && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <fieldset disabled={locked || submitting} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField label="Title" htmlFor="title" error={errors.title}>
              <input id="title" name="title" className={inputClass('title')} value={values.title} onChange={handleChange} maxLength={120} />
            </FormField>
          </div>

          <FormField label="Assigned employee" htmlFor="assignedEmployee" error={errors.assignedEmployee}>
            <select id="assignedEmployee" name="assignedEmployee" className={inputClass('assignedEmployee')} value={values.assignedEmployee} onChange={handleChange}>
              <option value="">{employees.loading ? 'Loading employees…' : 'Select…'}</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeId}){e.status !== 'Active' ? ` – ${e.status}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Priority" htmlFor="priority" error={errors.priority}>
            <select id="priority" name="priority" className={inputClass('priority')} value={values.priority} onChange={handleChange}>
              <option value="">Select…</option>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Department" htmlFor="department" error={errors.department}>
            <select id="department" name="department" className={inputClass('department')} value={values.department} onChange={handleChange}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Start date" htmlFor="startDate" error={errors.startDate}>
            <input id="startDate" name="startDate" type="date" className={inputClass('startDate')} value={values.startDate} onChange={handleChange} />
          </FormField>

          <FormField label="Due date" htmlFor="dueDate" error={errors.dueDate}>
            <input id="dueDate" name="dueDate" type="date" className={inputClass('dueDate')} value={values.dueDate} min={values.startDate} onChange={handleChange} />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Description" htmlFor="description" error={errors.description}>
              <textarea id="description" name="description" rows={4} className={inputClass('description')} value={values.description} onChange={handleChange} />
            </FormField>
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <Link to={isEdit ? `/tasks/${id}` : '/tasks'} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={locked || submitting}>
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </form>
    </>
  );
}
