import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { ShiftCode } from '../types';

const parseCycle = (value: string): ShiftCode[] | null => {
  const cycle = value.split(',').map((item) => item.trim().toUpperCase());
  if (cycle.length === 0) return null;
  const valid = cycle.every((item) => item === 'MORNING' || item === 'AFTERNOON' || item === 'REST');
  return valid ? (cycle as ShiftCode[]) : null;
};

export const SettingsPage = () => {
  const { state, updateRules } = useAppState();
  const [form, setForm] = useState({
    cycleStartDate: state.rules.cycleStartDate,
    cycle: state.rules.cycle.join(', '),
    morningTime: state.rules.shiftTimes.MORNING,
    afternoonTime: state.rules.shiftTimes.AFTERNOON,
    team1Offset: String(state.rules.teamOffsets['team-1'] ?? 0),
    team2Offset: String(state.rules.teamOffsets['team-2'] ?? 2),
    team3Offset: String(state.rules.teamOffsets['team-3'] ?? 4),
    minStaffing: String(state.rules.minStaffing),
    annualLeaveAllowance: String(state.rules.annualLeaveAllowance),
    leaveCountPolicy: state.rules.leaveCountPolicy,
    notes: state.rules.operationalNotes.join('\n')
  });
  const [error, setError] = useState('');

  return (
    <div className="space-y-4">
      <PageHeader title="Settings / Rules" subtitle="Edit cycle, offsets, shift times, staffing thresholds, and operational assumptions." />

      <section className="card p-4">
        <h3 className="text-base font-semibold">Scheduling Rules</h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Cycle Start Date</label>
            <input className="input" type="date" value={form.cycleStartDate} onChange={(event) => setForm({ ...form, cycleStartDate: event.target.value })} />
          </div>
          <div>
            <label className="label">Cycle Sequence</label>
            <input className="input" value={form.cycle} onChange={(event) => setForm({ ...form, cycle: event.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Use comma-separated MORNING, AFTERNOON, REST values.</p>
          </div>
          <div>
            <label className="label">Morning Shift Time</label>
            <input className="input" value={form.morningTime} onChange={(event) => setForm({ ...form, morningTime: event.target.value })} />
          </div>
          <div>
            <label className="label">Afternoon Shift Time</label>
            <input className="input" value={form.afternoonTime} onChange={(event) => setForm({ ...form, afternoonTime: event.target.value })} />
          </div>
          <div>
            <label className="label">Team 1 Offset</label>
            <input className="input" type="number" value={form.team1Offset} onChange={(event) => setForm({ ...form, team1Offset: event.target.value })} />
          </div>
          <div>
            <label className="label">Team 2 Offset</label>
            <input className="input" type="number" value={form.team2Offset} onChange={(event) => setForm({ ...form, team2Offset: event.target.value })} />
          </div>
          <div>
            <label className="label">Team 3 Offset</label>
            <input className="input" type="number" value={form.team3Offset} onChange={(event) => setForm({ ...form, team3Offset: event.target.value })} />
          </div>
          <div>
            <label className="label">Minimum Staffing</label>
            <input className="input" type="number" value={form.minStaffing} onChange={(event) => setForm({ ...form, minStaffing: event.target.value })} />
          </div>
          <div>
            <label className="label">Annual Leave Allowance</label>
            <input className="input" type="number" value={form.annualLeaveAllowance} onChange={(event) => setForm({ ...form, annualLeaveAllowance: event.target.value })} />
          </div>
          <div>
            <label className="label">Leave Count Policy</label>
            <select className="input" value={form.leaveCountPolicy} onChange={(event) => setForm({ ...form, leaveCountPolicy: event.target.value as 'ROSTERED_WORKDAYS' })}>
              <option value="ROSTERED_WORKDAYS">ROSTERED_WORKDAYS</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="label">Operational Notes (Editable)</label>
          <textarea className="input min-h-[140px]" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>

        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <button
          className="btn-primary mt-3"
          onClick={() => {
            setError('');
            const parsedCycle = parseCycle(form.cycle);
            const minStaffing = Number(form.minStaffing);
            const annualLeaveAllowance = Number(form.annualLeaveAllowance);
            const team1 = Number(form.team1Offset);
            const team2 = Number(form.team2Offset);
            const team3 = Number(form.team3Offset);

            if (!parsedCycle) {
              setError('Invalid cycle sequence. Use MORNING, AFTERNOON, REST only.');
              return;
            }
            if (!Number.isFinite(minStaffing) || minStaffing < 1) {
              setError('Minimum staffing must be 1 or more.');
              return;
            }
            if (!Number.isFinite(annualLeaveAllowance) || annualLeaveAllowance < 0) {
              setError('Annual leave allowance must be 0 or more.');
              return;
            }
            if ([team1, team2, team3].some((value) => !Number.isFinite(value))) {
              setError('Team offsets must be valid numbers.');
              return;
            }

            if (!window.confirm('Apply rule changes? Coverage and leave projections will update immediately.')) {
              return;
            }

            updateRules({
              ...state.rules,
              cycleStartDate: form.cycleStartDate,
              cycle: parsedCycle,
              shiftTimes: {
                MORNING: form.morningTime,
                AFTERNOON: form.afternoonTime
              },
              teamOffsets: {
                'team-1': team1,
                'team-2': team2,
                'team-3': team3
              },
              minStaffing,
              annualLeaveAllowance,
              leaveCountPolicy: form.leaveCountPolicy,
              operationalNotes: form.notes
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
            });
          }}
        >
          Save Rules
        </button>
      </section>
    </div>
  );
};
