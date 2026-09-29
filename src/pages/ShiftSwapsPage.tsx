import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { fromDateKey } from '../utils/date';
import { SHIFT_LABELS, getEmployeePlannedShift, simulateSwapCoverage } from '../utils/schedule';

export const ShiftSwapsPage = () => {
  const { state, loading, addSwap, updateSwapStatus } = useAppState();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    fromEmployeeId: state.employees[0]?.id ?? '',
    toEmployeeId: state.employees[20]?.id ?? ''
  });
  const [error, setError] = useState('');

  const fromEmployee = state.employees.find((employee) => employee.id === form.fromEmployeeId);
  const toEmployee = state.employees.find((employee) => employee.id === form.toEmployeeId);

  const preview = useMemo(() => {
    if (!fromEmployee || !toEmployee) return null;
    const date = fromDateKey(form.date);
    const fromShift = getEmployeePlannedShift(state, fromEmployee, date);
    const toShift = getEmployeePlannedShift(state, toEmployee, date);

    return {
      fromShift,
      toShift,
      coverage: simulateSwapCoverage(state, {
        date: form.date,
        fromEmployeeId: fromEmployee.id,
        toEmployeeId: toEmployee.id,
        fromShift,
        toShift
      })
    };
  }, [state, form, fromEmployee, toEmployee]);

  const blocked =
    !fromEmployee ||
    !toEmployee ||
    fromEmployee.teamId === toEmployee.teamId ||
    !preview?.coverage ||
    preview.coverage.afterFromTeam.isBelow ||
    preview.coverage.afterToTeam.isBelow;

  const pendingSwaps = state.swaps.filter((swap) => swap.status === 'PENDING');
  const history = state.swaps.filter((swap) => swap.status !== 'PENDING').slice().reverse().slice(0, 8);

  if (loading) return <LoadingState message="Loading swap workflows..." />;

  return (
    <div className="space-y-4">
      <PageHeader title="Shift Swaps" subtitle="Cross-team swap requests with staffing impact preview and manager approval." />

      <section className="card p-4">
        <h3 className="text-base font-semibold">Create Swap Request</h3>
        <p className="mt-1 text-sm text-slate-600">Swaps are blocked if either team falls below minimum staffing on the selected date.</p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
          <div>
            <label className="label">From Employee</label>
            <select className="input" value={form.fromEmployeeId} onChange={(event) => setForm({ ...form, fromEmployeeId: event.target.value })}>
              {state.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">To Employee</label>
            <select className="input" value={form.toEmployeeId} onChange={(event) => setForm({ ...form, toEmployeeId: event.target.value })}>
              {state.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
        </div>

        {preview?.coverage && fromEmployee && toEmployee ? (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p>
              {fromEmployee.name} ({SHIFT_LABELS[preview.fromShift]}) <span className="mx-1">↔</span> {toEmployee.name} ({SHIFT_LABELS[preview.toShift]})
            </p>
            <p className="mt-1">Before: {preview.coverage.beforeFromTeam.available}/{preview.coverage.beforeFromTeam.required} and {preview.coverage.beforeToTeam.available}/{preview.coverage.beforeToTeam.required}</p>
            <p>After: {preview.coverage.afterFromTeam.available}/{preview.coverage.afterFromTeam.required} and {preview.coverage.afterToTeam.available}/{preview.coverage.afterToTeam.required}</p>
            {blocked ? <p className="mt-2 font-semibold text-red-700">Blocked: same team or under-minimum impact.</p> : <p className="mt-2 text-emerald-700">Swap keeps both teams within minimum staffing.</p>}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <button
          className="btn-primary mt-3"
          disabled={blocked}
          onClick={() => {
            setError('');
            if (!fromEmployee || !toEmployee || !preview) return;
            addSwap({
              id: `swap-${Date.now()}`,
              date: form.date,
              fromEmployeeId: fromEmployee.id,
              toEmployeeId: toEmployee.id,
              fromShift: preview.fromShift,
              toShift: preview.toShift,
              status: 'PENDING'
            });
          }}
        >
          Create Pending Request
        </button>
      </section>

      <section className="card p-4">
        <h3 className="text-base font-semibold">Pending Requests</h3>
        {pendingSwaps.length === 0 ? (
          <EmptyState title="No pending swaps" description="Create a request above to start the approval workflow." />
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {pendingSwaps.map((swap) => {
              const from = state.employees.find((employee) => employee.id === swap.fromEmployeeId);
              const to = state.employees.find((employee) => employee.id === swap.toEmployeeId);
              return (
                <div key={swap.id} className="rounded-md border border-slate-200 p-3">
                  <p>{swap.date} · {from?.name ?? 'Unknown'} ({SHIFT_LABELS[swap.fromShift]}) ↔ {to?.name ?? 'Unknown'} ({SHIFT_LABELS[swap.toShift]})</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (!from || !to) return;
                        const check = simulateSwapCoverage(state, {
                          date: swap.date,
                          fromEmployeeId: swap.fromEmployeeId,
                          toEmployeeId: swap.toEmployeeId,
                          fromShift: swap.fromShift,
                          toShift: swap.toShift
                        });
                        if (!check || check.afterFromTeam.isBelow || check.afterToTeam.isBelow) {
                          setError('Approval blocked. Current data indicates below-minimum coverage after swap.');
                          return;
                        }
                        updateSwapStatus(swap.id, 'APPROVED');
                      }}
                    >
                      Approve
                    </button>
                    <button className="btn-secondary" onClick={() => updateSwapStatus(swap.id, 'REJECTED', 'Manager rejected request.')}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-4">
        <h3 className="text-base font-semibold">Recent Decisions</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No approved or rejected requests yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {history.map((swap) => (
              <li key={swap.id} className="rounded border border-slate-200 px-3 py-2">
                {swap.date} · {swap.status} {swap.reason ? `· ${swap.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
