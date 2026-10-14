import { useState } from 'react';
import FormField from '../../components/FormField.jsx';
import SearchInput from '../../components/SearchInput.jsx';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../../constants.js';

const SORT_OPTIONS = [
  { value: 'fullName', label: 'Name' },
  { value: 'joiningDate', label: 'Joining date' },
  { value: 'employeeId', label: 'Employee ID' },
];

const FILTER_KEYS = ['search', 'department', 'status'];

export default function EmployeeFilters({ params, update }) {
  const [searchKey, setSearchKey] = useState(0);
  const change = (name) => (e) => update({ [name]: e.target.value });
  const hasFilters = FILTER_KEYS.some((key) => params[key]);

  function clearFilters() {
    setSearchKey((k) => k + 1);
    update(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));
  }

  return (
    <div className="card mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <FormField label="Search" htmlFor="search">
            <SearchInput
              key={searchKey}
              id="search"
              value={params.search ?? ''}
              placeholder="Name, email or employee ID"
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
        <FormField label="Status" htmlFor="status">
          <select id="status" className="input" value={params.status ?? ''} onChange={change('status')}>
            <option value="">All statuses</option>
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Sort by" htmlFor="sort">
          <select id="sort" className="input" value={params.sort ?? 'fullName'} onChange={change('sort')}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <button className="btn btn-ghost" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
