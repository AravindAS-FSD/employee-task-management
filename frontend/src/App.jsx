import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import EmployeeList from './features/employees/EmployeeList.jsx';
import EmployeeForm from './features/employees/EmployeeForm.jsx';
import EmployeeView from './features/employees/EmployeeView.jsx';
import TaskList from './features/tasks/TaskList.jsx';
import TaskForm from './features/tasks/TaskForm.jsx';
import TaskView from './features/tasks/TaskView.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="employees">
          <Route index element={<EmployeeList />} />
          <Route path="new" element={<EmployeeForm />} />
          <Route path=":id" element={<EmployeeView />} />
          <Route path=":id/edit" element={<EmployeeForm />} />
        </Route>

        <Route path="tasks">
          <Route index element={<TaskList />} />
          <Route path="new" element={<TaskForm />} />
          <Route path=":id" element={<TaskView />} />
          <Route path=":id/edit" element={<TaskForm />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
