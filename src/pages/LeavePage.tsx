import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { LeaveType } from '../types';
import { getAnnualLeaveUsed } from '../utils/schedule';

export const LeavePage = () => {
  const { state, loading, upsertLeave, removeLeave } = useAppState();
  const [form, setForm] = useState({
    employeeId: state.employees[0]?.id ?? '',
    date: new Date().toISOString().slice(0, 10),
    type: 'ANNUAL' as LeaveType,
    notes: ''
  });
  const [error, setError] = useState('');

  const entries = useMemo(
    () => [...state.leaves].sort((a, b) => a.date.localeCompare(b.date)),
    [state.leaves]
  );

  if (loading) return <LoadingState message="Loading leave data..." />;

  return (
    <div className="space-y-4">
      <PageHeader title="Leave" subtitle="Manager-managed annual, medical, and off-in-lieu entries." />

      <section className="card p-4">
        <h3 className="text-base font-semibold">Add or Replace Leave Entry</h3>
        <p className="mt-1 text-sm text-slate-600">Annual leave is validated against the per-year allowance and counted on rostered workdays.</p>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>
              {state.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LeaveType })}>
              <option value="ANNUAL">Annual Leave</option>
              <option value="MEDICAL">Medical Leave</option>
              <option value="OFF_IN_LIEU">Off-in-Lieu</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
        </div>

        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <button
          className="btn-primary mt-3"
          onClick={() => {
            setError('');
            const employee = state.employees.find((item) => item.id === form.employeeId);
            if (!employee) return;

            if (form.type === 'ANNUAL') {
              const year = new Date(`${form.date}T00:00:00`).getFullYear();
              const used = getAnnualLeaveUsed(state, employee, year);
              const existingForDate = state.leaves.find((entry) => entry.employeeId === employee.id && entry.date === form.date && entry.type === 'ANNUAL');
              const projected = existingForDate ? used : used + 1;

              if (projected > state.rules.annualLeaveAllowance) {
                setError('Annual leave allowance would be exceeded for this calendar year.');
                return;
              }
            }

            upsertLeave({
              id: `leave-${Date.now()}`,
              employeeId: form.employeeId,
              date: form.date,
              type: form.type,
              notes: form.notes
            });
          }}
        >
          Save Leave
        </button>
      </section>

      <section className="card p-4">
        <h3 className="text-base font-semibold">Leave Entries</h3>
        {entries.length === 0 ? (
          <EmptyState title="No leave entries" description="Create a leave record to reflect annual leave, medical leave, or off-in-lieu." />
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th>Date</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="py-2">{entry.date}</td>
                  <td>{state.employees.find((employee) => employee.id === entry.employeeId)?.name ?? 'Unknown'}</td>
                  <td>{entry.type}</td>
                  <td>{entry.notes || '-'}</td>
                  <td className="text-right">
                    <button className="btn-secondary" onClick={() => removeLeave(entry.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
