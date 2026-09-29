import { AppState, Employee, Rules, Team } from '../types';
import { addDays, toDateKey } from '../utils/date';

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Avery', 'Riley', 'Drew', 'Skyler', 'Quinn', 'Reese', 'Hayden', 'Parker', 'Rowan', 'Sydney'];
const lastNames = ['Ng', 'Patel', 'Kim', 'Garcia', 'Smith', 'Lopez', 'Chen', 'Ali', 'Brown', 'Singh', 'Miller', 'Tan', 'Lee', 'Jones', 'Davis'];

const teams: Team[] = [
  { id: 'team-1', name: 'Team 1', offset: 0 },
  { id: 'team-2', name: 'Team 2', offset: 2 },
  { id: 'team-3', name: 'Team 3', offset: 4 }
];

const buildEmployees = (): Employee[] => {
  const rows: Employee[] = [];
  for (let t = 1; t <= 3; t += 1) {
    for (let i = 0; i < 15; i += 1) {
      rows.push({
        id: `emp-${t}-${i + 1}`,
        teamId: `team-${t}`,
        name: `${firstNames[i]} ${lastNames[(i + t) % lastNames.length]}`,
        role: i < 2 ? 'Senior Operator' : 'Operator',
        active: true
      });
    }
  }
  return rows;
};

const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

const rules: Rules = {
  cycle: ['AFTERNOON', 'AFTERNOON', 'MORNING', 'MORNING', 'REST', 'REST'],
  shiftTimes: {
    MORNING: '07:45-14:35',
    AFTERNOON: '14:35-21:35'
  },
  cycleStartDate: toDateKey(startDate),
  teamOffsets: {
    'team-1': 0,
    'team-2': 2,
    'team-3': 4
  },
  minStaffing: 10,
  annualLeaveAllowance: 14,
  leaveCountPolicy: 'ROSTERED_WORKDAYS',
  operationalNotes: [
    'Annual leave is 14 rostered workdays per calendar year.',
    'Off-in-Lieu is entered manually because no accrual policy was provided.',
    'Recall is manager-managed because no response/notification policy was specified.',
    'Minimum staffing is 10 available employees per team on the scheduled shift.'
  ]
};

export const buildDemoState = (): AppState => ({
  teams,
  employees: buildEmployees(),
  leaves: [
    { id: 'leave-1', employeeId: 'emp-1-2', date: toDateKey(addDays(now, 1)), type: 'ANNUAL', notes: 'Family event' },
    { id: 'leave-2', employeeId: 'emp-1-6', date: toDateKey(addDays(now, 1)), type: 'MEDICAL', notes: 'Medical review' },
    { id: 'leave-3', employeeId: 'emp-2-4', date: toDateKey(addDays(now, 3)), type: 'OFF_IN_LIEU', notes: 'Manual OIL entry' },
    { id: 'leave-4', employeeId: 'emp-3-9', date: toDateKey(addDays(now, 4)), type: 'ANNUAL', notes: 'Planned leave' }
  ],
  overrides: [],
  recalls: [
    { id: 'recall-1', employeeId: 'emp-3-1', date: toDateKey(addDays(now, 2)), status: 'STANDBY' }
  ],
  swaps: [],
  rules
});
