import { useState } from 'react';
import FormField from '../../components/FormField.jsx';
import SearchInput from '../../components/SearchInput.jsx';
import { DEPARTMENTS, PRIORITIES, TASK_STATUS_FILTERS } from '../../constants.js';

const SORT_OPTIONS = [
  { value: 'createdDate', label: 'Created date' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority (importance)' },
  { value: 'title', label: 'Title' },
];

const FILTER_KEYS = ['search', 'department', 'priority', 'status', 'employee', 'dueFrom', 'dueTo'];

export default function TaskFilters({ params, update }) {
  const [searchKey, setSearchKey] = useState(0);
  const change = (name) => (e) => update({ [name]: e.target.value });
  const hasFilters = FILTER_KEYS.some((key) => params[key]);

  function clearFilters() {
    setSearchKey((k) => k + 1);
    update(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));
  }

  return (
    <div className="card mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <FormField label="Search" htmlFor="search">
            <SearchInput
              key={searchKey}
              id="search"
              value={params.search ?? ''}
              placeholder="Task title or employee name"
              onDebouncedChange={(value) => update({ search: value })}
            />
          </FormField>
        </div>

        <FormField label="Department" htmlFor="department">
          <select id="department" className="input" value={params.department ?? ''} onChange={change('department')}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Priority" htmlFor="priority">
          <select id="priority" className="input" value={params.priority ?? ''} onChange={change('priority')}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Status" htmlFor="status">
          <select id="status" className="input" value={params.status ?? ''} onChange={change('status')}>
            <option value="">All statuses</option>
            {TASK_STATUS_FILTERS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Due from" htmlFor="dueFrom">
          <input id="dueFrom" type="date" className="input" value={params.dueFrom ?? ''} onChange={change('dueFrom')} />
        </FormField>

        <FormField label="Due to" htmlFor="dueTo">
          <input id="dueTo" type="date" className="input" value={params.dueTo ?? ''} min={params.dueFrom} onChange={change('dueTo')} />
        </FormField>

        <FormField label="Sort by" htmlFor="sort">
          <select id="sort" className="input" value={params.sort ?? 'createdDate'} onChange={change('sort')}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Order" htmlFor="order">
          <select id="order" className="input" value={params.order ?? 'desc'} onChange={change('order')}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </FormField>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        {params.employee ? (
          <p className="text-slate-700">
            Showing tasks for one employee.{' '}
            <button className="link" onClick={() => update({ employee: '' })}>
              Remove employee filter
            </button>
          </p>
        ) : (
          <span />
        )}
        {hasFilters && (
          <button className="btn btn-ghost" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
