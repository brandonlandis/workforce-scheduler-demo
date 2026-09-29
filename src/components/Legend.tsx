import { ShiftDisplayCode } from '../types';
import { SHIFT_LABELS, SHIFT_STYLES } from '../utils/schedule';

const legendOrder: ShiftDisplayCode[] = ['MORNING', 'AFTERNOON', 'REST', 'ANNUAL', 'MEDICAL', 'OFF_IN_LIEU', 'RECALLED'];

export const Legend = () => (
  <div className="card p-3">
    <h3 className="text-sm font-semibold">Legend</h3>
    <div className="mt-2 flex flex-wrap gap-2">
      {legendOrder.map((code) => (
        <span key={code} className={`badge ${SHIFT_STYLES[code]}`}>
          {SHIFT_LABELS[code]}
        </span>
      ))}
    </div>
  </div>
);
