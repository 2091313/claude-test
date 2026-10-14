import type { Rule } from './model';

export const DAY = 86400000;
export const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const MONL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export const pad = (n: number) => String(n).padStart(2, '0');
/** Local calendar date as YYYY-MM-DD. */
export const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseD = (s: string) => {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
};
export const addDays = (s: string, n: number) => {
  const d = parseD(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const diffDays = (a: string, b: string) => Math.round((parseD(a).getTime() - parseD(b).getTime()) / DAY);
export const dowOf = (s: string) => parseD(s).getDay();

/** Due date of a freshly created (or re-scheduled) task. */
export const firstDue = (r: Rule, today: string) =>
  r.type === 'weekly' ? addDays(today, (r.weekday - dowOf(today) + 7) % 7)
    : r.type === 'once' && r.hasDate && r.date ? r.date : today;

/** Next due date of a recurring task completed on `today`. */
export const nextDue = (r: Rule, today: string) =>
  r.type === 'daily' ? addDays(today, 1)
    : r.type === 'interval' ? addDays(today, Math.max(1, r.interval))
      : r.type === 'weekly' ? addDays(today, ((r.weekday - dowOf(today) + 7) % 7) || 7) : today;

export const ruleLabel = (r: Pick<Rule, 'type' | 'weekday' | 'interval'>) =>
  r.type === 'once' ? 'Einmalig' : r.type === 'daily' ? 'Täglich'
    : r.type === 'weekly' ? 'Jeden ' + WDL[r.weekday] : (r.interval === 1 ? 'Täglich' : 'Alle ' + r.interval + ' Tage');

export const shortDate = (s: string) => {
  const d = parseD(s);
  return WD[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()];
};
export const longDate = (s: string) => {
  const d = parseD(s);
  return WDL[d.getDay()] + ', ' + d.getDate() + '. ' + MONL[d.getMonth()];
};
export const whenLabel = (due: string, today: string) => {
  const d = diffDays(due, today);
  return d === 0 ? 'Heute' : d === 1 ? 'Morgen' : d < 7 ? WDL[dowOf(due)] : shortDate(due);
};

/** Consecutive days with at least one completion, ending today (or yesterday if today is still empty). */
export const streakOf = (days: Record<string, number>, today: string) => {
  let d = today, streak = 0;
  if (!days[d]) d = addDays(d, -1);
  while (days[d]) { streak++; d = addDays(d, -1); }
  return streak;
};
