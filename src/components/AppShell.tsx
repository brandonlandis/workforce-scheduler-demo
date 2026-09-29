import { NavLink, Outlet } from 'react-router-dom';
import { useAppState } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/employees', label: 'Employees' },
  { to: '/leave', label: 'Leave' },
  { to: '/swaps', label: 'Shift Swaps' },
  { to: '/settings', label: 'Settings / Rules' }
];

export const AppShell = () => {
  const { resetDemoData } = useAppState();

  return (
    <div className="app-gradient min-h-screen">
      <div className="grid min-h-screen md:grid-cols-[270px_1fr]">
        <aside className="border-r border-slate-200 bg-white/95 p-4 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-bold">Workforce Scheduler</h1>
            <p className="mt-1 text-xs text-slate-500">Demo mode. Data is saved in local browser storage.</p>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-ink text-white' : 'text-slate-700 hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button className="btn-secondary mt-6 w-full" onClick={resetDemoData}>
            Reset Demo Dataset
          </button>
        </aside>

        <main className="p-4 md:p-6">
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Demo only: No live backend is connected. All updates persist in this browser via local storage.
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
