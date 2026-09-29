import { useMemo, useState } from 'react';
import { CoverageStrip } from '../components/CoverageStrip';
import { EmptyState } from '../components/EmptyState';
import { Legend } from '../components/Legend';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { TeamTabs } from '../components/TeamTabs';
import { useAppState } from '../context/AppContext';
import { daysInMonth, toDateKey } from '../utils/date';
import { SHIFT_LABELS, SHIFT_STYLES, getCoverage, getEmployeeDisplayStatus } from '../utils/schedule';
import { ShiftCode } from '../types';

export const SchedulePage = () => {
  const { state, loading, upsertOverride, removeOverride } = useAppState();
  const [month, setMonth] = useState(new Date());
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? 'team-1');
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [newShift, setNewShift] = useState<ShiftCode>('MORNING');

  const monthDates = useMemo(() => daysInMonth(month), [month]);
  const team = state.teams.find((entry) => entry.id === teamId) ?? state.teams[0];
  const teamEmployees = state.employees.filter((employee) => employee.teamId === teamId && employee.active);

  const selectedEmployee = selectedCell
    ? state.employees.find((employee) => employee.id === selectedCell.employeeId)
    : undefined;

  const selectedOverride = selectedCell
    ? state.overrides.find((override) => override.employeeId === selectedCell.employeeId && override.date === selectedCell.date)
    : undefined;

  if (loading) return <LoadingState message="Loading schedule matrix..." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedule"
        subtitle={`6-day cycle with sticky date headers and sticky employee names. Morning ${state.rules.shiftTimes.MORNING}, Afternoon ${state.rules.shiftTimes.AFTERNOON}.`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Previous</button>
            <button className="btn-secondary" onClick={() => setMonth(new Date())}>Current Month</button>
            <button className="btn-secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</button>
          </>
        }
      />

      <TeamTabs teams={state.teams} activeTeamId={teamId} onChange={setTeamId} />
      <CoverageStrip state={state} team={team} dates={monthDates} />
      <Legend />

      {teamEmployees.length === 0 ? (
        <EmptyState title="No active employees" description="This team has no active employee rows to display in the schedule." />
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[68vh] overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-white px-3 py-2 text-left">Employee</th>
                  {monthDates.map((date) => {
                    const coverage = getCoverage(state, teamId, date);
                    return (
                      <th key={toDateKey(date)} className="sticky top-0 z-20 min-w-[95px] border-b border-slate-200 bg-white px-2 py-2 text-center">
                        <div className="text-sm font-semibold">{date.getDate()}</div>
                        <div className="text-[10px] text-slate-500">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                        <div className={`mt-1 text-[10px] ${coverage.isBelow ? 'text-red-700' : 'text-slate-500'}`}>
                          {coverage.available}/{coverage.required}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {teamEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 font-medium">{employee.name}</td>
                    {monthDates.map((date) => {
                      const dateKey = toDateKey(date);
                      const status = getEmployeeDisplayStatus(state, employee, date);
                      return (
                        <td key={`${employee.id}-${dateKey}`} className="border-b border-slate-100 p-1">
                          <button
                            className={`w-full rounded-md border px-1 py-2 text-[11px] ${SHIFT_STYLES[status]}`}
                            onClick={() => {
                              setSelectedCell({ employeeId: employee.id, date: dateKey });
                              setNewShift('MORNING');
                            }}
                            aria-label={`${employee.name} ${dateKey} ${SHIFT_LABELS[status]}`}
                          >
                            {SHIFT_LABELS[status]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCell && selectedEmployee ? (
        <div className="card p-4">
          <h3 className="font-semibold">Edit Shift Override</h3>
          <p className="mt-1 text-sm text-slate-600">
            {selectedEmployee.name} · {selectedCell.date}. Leave entries still take precedence over shift overrides.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-[240px_auto_auto] md:items-end">
            <div>
              <label className="label">Override Shift</label>
              <select className="input" value={newShift} onChange={(event) => setNewShift(event.target.value as ShiftCode)}>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="REST">Rest</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                upsertOverride({
                  id: selectedOverride?.id ?? `override-${Date.now()}`,
                  employeeId: selectedCell.employeeId,
                  date: selectedCell.date,
                  shift: newShift
                });
              }}
            >
              Save Override
            </button>
            <button
              className="btn-secondary"
              onClick={() => removeOverride(selectedCell.employeeId, selectedCell.date)}
            >
              Clear Override
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
