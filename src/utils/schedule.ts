import { AppState, Employee, LeaveType, ShiftCode, ShiftDisplayCode, Team } from '../types';
import { dayDiff, fromDateKey, toDateKey } from './date';

export const SHIFT_LABELS: Record<ShiftDisplayCode, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  REST: 'Rest',
  ANNUAL: 'Annual Leave',
  MEDICAL: 'Medical Leave',
  OFF_IN_LIEU: 'Off-in-Lieu',
  RECALLED: 'Recalled'
};

export const SHIFT_STYLES: Record<ShiftDisplayCode, string> = {
  MORNING: 'bg-morning/10 text-morning border-morning/20',
  AFTERNOON: 'bg-afternoon/10 text-afternoon border-afternoon/20',
  REST: 'bg-rest/10 text-rest border-rest/20',
  ANNUAL: 'bg-annual/10 text-annual border-annual/20',
  MEDICAL: 'bg-medical/10 text-medical border-medical/20',
  OFF_IN_LIEU: 'bg-oil/10 text-oil border-oil/20',
  RECALLED: 'bg-recalled/10 text-recalled border-recalled/20'
};

const mod = (value: number, m: number): number => ((value % m) + m) % m;

const getTeam = (state: AppState, teamId: string): Team | undefined => state.teams.find((team) => team.id === teamId);

export const getTeamPlannedShift = (state: AppState, teamId: string, date: Date): ShiftCode => {
  const team = getTeam(state, teamId);
  if (!team) return 'REST';
  const cycle = state.rules.cycle;
  const startDate = fromDateKey(state.rules.cycleStartDate);
  const offset = state.rules.teamOffsets[team.id] ?? team.offset;
  const index = mod(dayDiff(date, startDate) + offset, cycle.length);
  return cycle[index];
};

const getLeaveType = (state: AppState, employeeId: string, dateKey: string): LeaveType | undefined =>
  state.leaves.find((leave) => leave.employeeId === employeeId && leave.date === dateKey)?.type;

const getRecall = (state: AppState, employeeId: string, dateKey: string) =>
  state.recalls.find((recall) => recall.employeeId === employeeId && recall.date === dateKey);

const getApprovedSwap = (state: AppState, employeeId: string, dateKey: string) =>
  state.swaps.find((swap) => swap.status === 'APPROVED' && swap.date === dateKey && (swap.fromEmployeeId === employeeId || swap.toEmployeeId === employeeId));

export const getEmployeePlannedShift = (state: AppState, employee: Employee, date: Date): ShiftCode => {
  const dateKey = toDateKey(date);
  const override = state.overrides.find((item) => item.employeeId === employee.id && item.date === dateKey)?.shift;
  let shift = override ?? getTeamPlannedShift(state, employee.teamId, date);

  const approvedSwap = getApprovedSwap(state, employee.id, dateKey);
  if (approvedSwap) {
    shift = approvedSwap.fromEmployeeId === employee.id ? approvedSwap.toShift : approvedSwap.fromShift;
  }

  return shift;
};

export const getEmployeeDisplayStatus = (state: AppState, employee: Employee, date: Date): ShiftDisplayCode => {
  const dateKey = toDateKey(date);
  const leave = getLeaveType(state, employee.id, dateKey);
  if (leave) return leave;
  const recall = getRecall(state, employee.id, dateKey);
  if (recall?.status === 'RECALLED') return 'RECALLED';
  return getEmployeePlannedShift(state, employee, date);
};

export const getCoverage = (state: AppState, teamId: string, date: Date) => {
  const scheduledShift = getTeamPlannedShift(state, teamId, date);
  const required = scheduledShift === 'REST' ? 0 : state.rules.minStaffing;
  const dateKey = toDateKey(date);

  if (scheduledShift === 'REST') {
    return {
      scheduledShift,
      required,
      available: 0,
      isBelow: false
    };
  }

  const baseAvailable = state.employees
    .filter((employee) => employee.teamId === teamId && employee.active)
    .filter((employee) => !getLeaveType(state, employee.id, dateKey))
    .filter((employee) => getEmployeePlannedShift(state, employee, date) === scheduledShift).length;

  const recalledAvailable = state.recalls
    .filter((recall) => recall.date === dateKey)
    .filter((recall) => recall.status === 'RECALLED')
    .filter((recall) => recall.targetTeamId === teamId)
    .filter((recall) => recall.targetShift === scheduledShift).length;

  const available = baseAvailable + recalledAvailable;
  return {
    scheduledShift,
    required,
    available,
    isBelow: available < required
  };
};

export const getAnnualLeaveUsed = (state: AppState, employee: Employee, year: number): number => {
  return state.leaves
    .filter((leave) => leave.employeeId === employee.id)
    .filter((leave) => leave.type === 'ANNUAL')
    .filter((leave) => fromDateKey(leave.date).getFullYear() === year)
    .filter((leave) => getEmployeePlannedShift(state, employee, fromDateKey(leave.date)) !== 'REST').length;
};

export const getRosteredDaysRemainingInYear = (state: AppState, employee: Employee, from: Date): number => {
  const end = new Date(from.getFullYear(), 11, 31);
  let total = 0;

  for (let d = new Date(from); d <= end; d.setDate(d.getDate() + 1)) {
    if (getEmployeePlannedShift(state, employee, new Date(d)) !== 'REST') {
      total += 1;
    }
  }

  return total;
};

export const simulateSwapCoverage = (
  state: AppState,
  draft: {
    date: string;
    fromEmployeeId: string;
    toEmployeeId: string;
    fromShift: ShiftCode;
    toShift: ShiftCode;
  }
) => {
  const fromEmployee = state.employees.find((employee) => employee.id === draft.fromEmployeeId);
  const toEmployee = state.employees.find((employee) => employee.id === draft.toEmployeeId);
  if (!fromEmployee || !toEmployee) return null;

  const date = fromDateKey(draft.date);
  const tempState: AppState = {
    ...state,
    swaps: [
      ...state.swaps,
      {
        id: '__sim__',
        date: draft.date,
        fromEmployeeId: draft.fromEmployeeId,
        toEmployeeId: draft.toEmployeeId,
        fromShift: draft.fromShift,
        toShift: draft.toShift,
        status: 'APPROVED'
      }
    ]
  };

  return {
    beforeFromTeam: getCoverage(state, fromEmployee.teamId, date),
    beforeToTeam: getCoverage(state, toEmployee.teamId, date),
    afterFromTeam: getCoverage(tempState, fromEmployee.teamId, date),
    afterToTeam: getCoverage(tempState, toEmployee.teamId, date)
  };
};
