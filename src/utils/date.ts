export const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const fromDateKey = (value: string): Date => new Date(`${value}T00:00:00`);

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const daysInMonth = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const values: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    values.push(new Date(d));
  }
  return values;
};

export const dayDiff = (a: Date, b: Date): number => {
  const ms = 24 * 60 * 60 * 1000;
  const aMs = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bMs = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((aMs - bMs) / ms);
};
