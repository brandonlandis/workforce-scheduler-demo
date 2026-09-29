import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { LeavePage } from './pages/LeavePage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { ShiftSwapsPage } from './pages/ShiftSwapsPage';

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/leave" element={<LeavePage />} />
      <Route path="/swaps" element={<ShiftSwapsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
