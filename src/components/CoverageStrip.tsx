import { AppState, Team } from '../types';
import { toDateKey } from '../utils/date';
import { SHIFT_LABELS, getCoverage } from '../utils/schedule';

interface CoverageStripProps {
  state: AppState;
  team: Team;
  dates: Date[];
}

export const CoverageStrip = ({ state, team, dates }: CoverageStripProps) => (
  <div className="card p-3">
    <h3 className="text-sm font-semibold">Coverage · {team.name}</h3>
    <div className="mt-2 flex flex-wrap gap-2">
      {dates.map((date) => {
        const item = getCoverage(state, team.id, date);
        const below = item.isBelow;
        return (
          <div
            key={toDateKey(date)}
            className={`rounded-md border px-2 py-1 text-xs ${below ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
          >
            <div className="font-semibold">{toDateKey(date).slice(5)}</div>
            <div>{SHIFT_LABELS[item.scheduledShift]} {item.available}/{item.required}</div>
            {below ? <div className="font-semibold">Below minimum</div> : null}
          </div>
        );
      })}
    </div>
  </div>
);
