import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildDemoState } from '../data/demo';
import { AppState, Employee, LeaveEntry, RecallEntry, Rules, ScheduleOverride, SwapRequest } from '../types';

interface AppContextValue {
  state: AppState;
  loading: boolean;
  error: string | null;
  updateEmployee: (employee: Employee) => void;
  upsertLeave: (leave: LeaveEntry) => void;
  removeLeave: (leaveId: string) => void;
  upsertOverride: (override: ScheduleOverride) => void;
  removeOverride: (employeeId: string, date: string) => void;
  upsertRecall: (recall: RecallEntry) => void;
  removeRecall: (employeeId: string, date: string) => void;
  addSwap: (swap: SwapRequest) => void;
  updateSwapStatus: (swapId: string, status: SwapRequest['status'], reason?: string) => void;
  updateRules: (rules: Rules) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'workforce-scheduler-demo-v2';
const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(buildDemoState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw) as AppState);
      }
    } catch {
      setError('Saved local data could not be loaded. Default demo data has been restored.');
      setState(buildDemoState());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    loading,
    error,
    updateEmployee: (employee) => {
      setState((prev) => ({
        ...prev,
        employees: prev.employees.some((row) => row.id === employee.id)
          ? prev.employees.map((row) => (row.id === employee.id ? employee : row))
          : [...prev.employees, employee]
      }));
    },
    upsertLeave: (leave) => {
      setState((prev) => {
        const pairMatch = prev.leaves.find((item) => item.employeeId === leave.employeeId && item.date === leave.date);
        if (pairMatch) {
          return {
            ...prev,
            leaves: prev.leaves.map((item) => (item.id === pairMatch.id ? { ...leave, id: pairMatch.id } : item))
          };
        }
        return {
          ...prev,
          leaves: prev.leaves.some((item) => item.id === leave.id)
            ? prev.leaves.map((item) => (item.id === leave.id ? leave : item))
            : [...prev.leaves, leave]
        };
      });
    },
    removeLeave: (leaveId) => {
      setState((prev) => ({ ...prev, leaves: prev.leaves.filter((leave) => leave.id !== leaveId) }));
    },
    upsertOverride: (override) => {
      setState((prev) => {
        const pairMatch = prev.overrides.find((item) => item.employeeId === override.employeeId && item.date === override.date);
        if (pairMatch) {
          return {
            ...prev,
            overrides: prev.overrides.map((item) => (item.id === pairMatch.id ? { ...override, id: pairMatch.id } : item))
          };
        }
        return {
          ...prev,
          overrides: prev.overrides.some((item) => item.id === override.id)
            ? prev.overrides.map((item) => (item.id === override.id ? override : item))
            : [...prev.overrides, override]
        };
      });
    },
    removeOverride: (employeeId, date) => {
      setState((prev) => ({
        ...prev,
        overrides: prev.overrides.filter((item) => !(item.employeeId === employeeId && item.date === date))
      }));
    },
    upsertRecall: (recall) => {
      setState((prev) => {
        const pairMatch = prev.recalls.find((item) => item.employeeId === recall.employeeId && item.date === recall.date);
        if (pairMatch) {
          return {
            ...prev,
            recalls: prev.recalls.map((item) => (item.id === pairMatch.id ? { ...recall, id: pairMatch.id } : item))
          };
        }
        return {
          ...prev,
          recalls: prev.recalls.some((item) => item.id === recall.id)
            ? prev.recalls.map((item) => (item.id === recall.id ? recall : item))
            : [...prev.recalls, recall]
        };
      });
    },
    removeRecall: (employeeId, date) => {
      setState((prev) => ({
        ...prev,
        recalls: prev.recalls.filter((item) => !(item.employeeId === employeeId && item.date === date))
      }));
    },
    addSwap: (swap) => {
      setState((prev) => ({ ...prev, swaps: [...prev.swaps, swap] }));
    },
    updateSwapStatus: (swapId, status, reason) => {
      setState((prev) => ({
        ...prev,
        swaps: prev.swaps.map((swap) => (swap.id === swapId ? { ...swap, status, reason } : swap))
      }));
    },
    updateRules: (rules) => {
      setState((prev) => ({ ...prev, rules }));
    },
    resetDemoData: () => {
      const fresh = buildDemoState();
      setState(fresh);
      setError(null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }), [state, loading, error]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider is required.');
  return value;
};
