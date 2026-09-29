import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { addDays, fromDateKey, toDateKey } from '../utils/date';
import { SHIFT_LABELS, getCoverage, getEmployeePlannedShift } from '../utils/schedule';

export const DashboardPage = () => {
  const { state, loading, error, upsertRecall, removeRecall } = useAppState();
  const [recallDate, setRecallDate] = useState(toDateKey(new Date()));
  const [employeeId, setEmployeeId] = useState(state.employees[0]?.id ?? '');
  const [targetTeamId, setTargetTeamId] = useState(state.teams[0]?.id ?? 'team-1');
  const [targetShift, setTargetShift] = useState<'MORNING' | 'AFTERNOON'>('MORNING');

  const today = new Date();

  const riskRows = useMemo(() => {
    const rows: Array<{ date: string; team: string; detail: string }> = [];
    for (let i = 0; i < 14; i += 1) {
      const date = addDays(today, i);
      for (const team of state.teams) {
        const coverage = getCoverage(state, team.id, date);
        if (coverage.isBelow) {
          rows.push({
            date: toDateKey(date),
            team: team.name,
            detail: `${SHIFT_LABELS[coverage.scheduledShift]} ${coverage.available}/${coverage.required}`
          });
        }
      }
    }
    return rows;
  }, [state, today]);

  const upcomingLeave = state.leaves
    .filter((leave) => fromDateKey(leave.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const standbyEligible = useMemo(() => {
    const date = fromDateKey(recallDate);
    return state.employees
      .filter((employee) => employee.active)
      .filter((employee) => getEmployeePlannedShift(state, employee, date) === 'REST')
      .filter((employee) => !state.leaves.some((leave) => leave.employeeId === employee.id && leave.date === recallDate));
  }, [state, recallDate]);

  const recallsForDate = state.recalls.filter((recall) => recall.date === recallDate);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Staffing posture, upcoming leave, coverage risks, and manager-controlled standby/recall overview."
      />

      {error ? <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {state.teams.map((team) => {
          const coverage = getCoverage(state, team.id, today);
          return (
            <article key={team.id} className="card p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{team.name}</p>
              <p className="mt-1 text-lg font-semibold">{SHIFT_LABELS[coverage.scheduledShift]}</p>
              <p className="mt-2 text-sm text-slate-700">Available {coverage.available} / Required {coverage.required}</p>
              {coverage.isBelow ? <p className="mt-2 text-sm font-semibold text-red-700">Warning: below minimum staffing.</p> : <p className="mt-2 text-sm text-emerald-700">Meets minimum staffing.</p>}
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-4">
          <h3 className="text-base font-semibold">Coverage Risks (Next 14 Days)</h3>
          {riskRows.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No immediate risks" description="All teams currently meet minimum staffing in the next 14 days." />
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              {riskRows.map((risk, index) => (
                <div key={`${risk.team}-${risk.date}-${index}`} className="rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
                  {risk.date} · {risk.team} · {risk.detail}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card p-4">
          <h3 className="text-base font-semibold">Upcoming Leave</h3>
          {upcomingLeave.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No upcoming leave" description="There are no future leave entries in the current demo data." />
            </div>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {upcomingLeave.map((leave) => (
                  <tr key={leave.id} className="border-t border-slate-100">
                    <td className="py-2">{leave.date}</td>
                    <td>{state.employees.find((employee) => employee.id === leave.employeeId)?.name ?? 'Unknown'}</td>
                    <td>{leave.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>

      <section className="card p-4">
        <h3 className="text-base font-semibold">Standby / Recall Manager</h3>
        <p className="mt-1 text-sm text-slate-600">Manual workflow only. No auto-notification or auto-response policy is assumed.</p>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={recallDate} onChange={(event) => setRecallDate(event.target.value)} />
          </div>
          <div>
            <label className="label">Standby Eligible Employee (Rest Day)</label>
            <select className="input" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              {standbyEligible.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target Team</label>
            <select className="input" value={targetTeamId} onChange={(event) => setTargetTeamId(event.target.value)}>
              {state.teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target Shift</label>
            <select className="input" value={targetShift} onChange={(event) => setTargetShift(event.target.value as 'MORNING' | 'AFTERNOON')}>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              if (!employeeId) return;
              upsertRecall({ id: `recall-${Date.now()}`, employeeId, date: recallDate, status: 'STANDBY' });
            }}
          >
            Mark Standby
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              if (!employeeId) return;
              upsertRecall({
                id: `recall-${Date.now()}`,
                employeeId,
                date: recallDate,
                status: 'RECALLED',
                targetTeamId,
                targetShift
              });
            }}
          >
            Confirm Recall
          </button>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold">Entries for {recallDate}</h4>
          {recallsForDate.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No standby/recall entries for this date.</p>
          ) : (
            <div className="mt-2 space-y-2 text-sm">
              {recallsForDate.map((entry) => {
                const employee = state.employees.find((row) => row.id === entry.employeeId);
                return (
                  <div key={entry.id} className="rounded-md border border-slate-200 p-2">
                    <div>
                      <span className="font-semibold">{employee?.name ?? 'Unknown'}</span>
                      <span className="ml-2">{entry.status}</span>
                      {entry.status === 'RECALLED' ? <span className="ml-2">{'->'} {entry.targetTeamId} {entry.targetShift}</span> : null}
                    </div>
                    <button className="btn-secondary mt-2" onClick={() => removeRecall(entry.employeeId, entry.date)}>Remove</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card p-4 text-sm text-slate-700">
        <h3 className="font-semibold">Operational Assumptions (Editable in Settings)</h3>
        <ul className="mt-2 list-disc pl-5">
          {state.rules.operationalNotes.map((note, index) => (
            <li key={`${note}-${index}`}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
