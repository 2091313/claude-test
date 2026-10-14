import { addDays, firstDue, ymd } from './dates';

export type RuleType = 'once' | 'daily' | 'weekly' | 'interval';
export type Theme = 'light' | 'dark' | 'system';

export interface Rule {
  type: RuleType;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  interval: number;
  /** Only for `once`: whether the user picked a due date (vs. "today"). */
  hasDate?: boolean;
  date?: string;
}

export interface Task extends Rule {
  id: string;
  title: string;
  createdAt: number;
  dueDate: string;
}

export interface ArchiveEntry {
  id: string;
  taskId: string;
  title: string;
  type: RuleType;
  weekday: number;
  interval: number;
  hasDate: boolean;
  createdAt: number;
  prevDue: string;
  completedAt: string;
  /** Local day of completion (YYYY-MM-DD). */
  day: string;
}

export interface Goal {
  target: number;
  milestones: number[];
  /** Total points at the moment this goal was started. */
  base: number;
}

export interface Data {
  tasks: Task[];
  archive: ArchiveEntry[];
  points: number;
  /** Completions per local day, for the streak. */
  days: Record<string, number>;
  theme: Theme;
  /** Test mode: number of days the clock is fast-forwarded. */
  dayOffset: number;
  nextId: number;
  goal: Goal;
}

export const KEY = 'taskmanager-v1';
export const UNDO_MS = 3000;
export const ARCHIVE_DAYS = 30;
export const DEFAULT_GOAL: Goal = { target: 100, milestones: [25, 50, 75], base: 0 };

export function defaults(): Data {
  const t = ymd(new Date()), dow = new Date().getDay();
  const mk = (id: string, title: string, r: Rule, c: number): Task => Object.assign({ id, title, createdAt: c, dueDate: firstDue(r, t) }, r);
  return {
    tasks: [
      mk('t1', '10 Minuten lesen', { type: 'daily', weekday: dow, interval: 2 }, 1),
      mk('t2', 'Pflanzen gießen', { type: 'interval', weekday: dow, interval: 3 }, 2),
      mk('t3', 'Zahnarzttermin vereinbaren', { type: 'once', weekday: dow, interval: 2, hasDate: false }, 3),
      mk('t4', 'Wäsche waschen', { type: 'weekly', weekday: 6, interval: 2 }, 4),
      mk('t5', 'Geschenk für Mama besorgen', { type: 'once', weekday: dow, interval: 2, hasDate: true, date: addDays(t, 4) }, 5)
    ],
    archive: [], points: 0, days: {}, theme: 'light', dayOffset: 0, nextId: 10,
    goal: { ...DEFAULT_GOAL }
  };
}

export function load(): Data {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && Array.isArray(d.tasks)) return { ...defaults(), ...d };
  } catch { /* corrupt or unavailable storage → start fresh */ }
  return defaults();
}

export function serialize(d: Data): string {
  const { tasks, archive, points, goal, days, theme, dayOffset, nextId } = d;
  return JSON.stringify({ tasks, archive, points, goal, days, theme, dayOffset, nextId });
}

export function save(json: string) {
  try { localStorage.setItem(KEY, json); } catch { /* quota / private mode */ }
}
