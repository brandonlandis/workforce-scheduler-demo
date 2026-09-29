export type ShiftCode = 'MORNING' | 'AFTERNOON' | 'REST';
export type LeaveType = 'ANNUAL' | 'MEDICAL' | 'OFF_IN_LIEU';
export type ShiftDisplayCode = ShiftCode | LeaveType | 'RECALLED';
export type LeaveCountPolicy = 'ROSTERED_WORKDAYS';

export interface Team {
  id: string;
  name: string;
  offset: number;
}

export interface Employee {
  id: string;
  name: string;
  teamId: string;
  role: string;
  active: boolean;
}

export interface LeaveEntry {
  id: string;
  employeeId: string;
  date: string;
  type: LeaveType;
  notes?: string;
}

export interface ScheduleOverride {
  id: string;
  employeeId: string;
  date: string;
  shift: ShiftCode;
}

export interface RecallEntry {
  id: string;
  employeeId: string;
  date: string;
  status: 'STANDBY' | 'RECALLED';
  targetTeamId?: string;
  targetShift?: Exclude<ShiftCode, 'REST'>;
}

export interface SwapRequest {
  id: string;
  date: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  fromShift: ShiftCode;
  toShift: ShiftCode;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface Rules {
  cycle: ShiftCode[];
  shiftTimes: Record<Exclude<ShiftCode, 'REST'>, string>;
  cycleStartDate: string;
  teamOffsets: Record<string, number>;
  minStaffing: number;
  annualLeaveAllowance: number;
  leaveCountPolicy: LeaveCountPolicy;
  operationalNotes: string[];
}

export interface AppState {
  teams: Team[];
  employees: Employee[];
  leaves: LeaveEntry[];
  overrides: ScheduleOverride[];
  recalls: RecallEntry[];
  swaps: SwapRequest[];
  rules: Rules;
}
