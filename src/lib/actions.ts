import { ARCHIVE_DAYS, type ArchiveEntry, type Data, type Rule, type RuleType, type Task } from './model';
import { addDays, diffDays, dowOf, firstDue, nextDue, whenLabel, ymd } from './dates';

export interface TaskForm {
  editId: string | null;
  title: string;
  mode: 'once' | 'repeat';
  when: 'today' | 'tomorrow' | 'date';
  date: string;
  freq: Exclude<RuleType, 'once'>;
  weekday: number;
  interval: string;
}

export interface GoalForm {
  target: string;
  ms: number[];
  add: string;
  err: string;
  /** True when the current goal is reached and saving starts a new cycle. */
  isNew: boolean;
}

/** Drop archive entries older than 30 days. Returns the same object if nothing changed. */
export function purge(d: Data, today: string): Data {
  const archive = d.archive.filter(e => diffDays(today, e.day) < ARCHIVE_DAYS);
  return archive.length === d.archive.length ? d : { ...d, archive };
}

/** Points collected towards the current goal. */
export const cycleOf = (d: Data) => Math.max(0, d.points - d.goal.base);

export function complete(d: Data, id: string, now: Date): { data: Data; msg: string; entryId: string } | null {
  const task = d.tasks.find(t => t.id === id);
  if (!task) return null;
  const today = ymd(now);
  const entry: ArchiveEntry = {
    id: 'a' + d.nextId, taskId: task.id, title: task.title, type: task.type, weekday: task.weekday, interval: task.interval,
    hasDate: !!task.hasDate, createdAt: task.createdAt, prevDue: task.dueDate, completedAt: now.toISOString(), day: today
  };
  const tasks = task.type === 'once'
    ? d.tasks.filter(t => t.id !== id)
    : d.tasks.map(t => t.id === id ? { ...t, dueDate: nextDue(t, today) } : t);
  const days = { ...d.days, [today]: (d.days[today] || 0) + 1 };
  const before = d.points - d.goal.base, after = before + 1;
  let msg = 'Erledigt · +1 Punkt';
  if (before < d.goal.target && after >= d.goal.target) msg = 'Endziel erreicht – das Glas ist voll!';
  else {
    const m = d.goal.milestones.find(m => before < m && after >= m);
    if (m) msg = 'Zwischenziel ' + m + ' erreicht!';
  }
  if (task.type !== 'once' && msg === 'Erledigt · +1 Punkt') msg = 'Erledigt · +1 · wieder ' + whenLabel(nextDue(task, today), today).replace('Morgen', 'morgen');
  return {
    data: { ...d, tasks, archive: [entry, ...d.archive], points: d.points + 1, days, nextId: d.nextId + 1 },
    msg, entryId: entry.id
  };
}

/**
 * Undo a completion. From the undo toast the task returns with its previous due date;
 * from the archive it returns due today. Either way the point is taken back.
 */
export function revert(d: Data, entryId: string, fromArchive: boolean, today: string): { data: Data; title: string } | null {
  const e = d.archive.find(x => x.id === entryId);
  if (!e) return null;
  const due = fromArchive ? today : e.prevDue;
  const ex = d.tasks.find(t => t.id === e.taskId);
  const tasks: Task[] = ex
    ? d.tasks.map(t => t.id === e.taskId ? { ...t, dueDate: due < t.dueDate ? due : t.dueDate } : t)
    : d.tasks.concat([{ id: e.taskId, title: e.title, type: e.type, weekday: e.weekday, interval: e.interval, hasDate: fromArchive ? false : e.hasDate, createdAt: e.createdAt, dueDate: due }]);
  const days = { ...d.days };
  if (days[e.day]) { days[e.day]--; if (!days[e.day]) delete days[e.day]; }
  return {
    data: { ...d, tasks, archive: d.archive.filter(x => x.id !== entryId), points: Math.max(0, d.points - 1), days },
    title: e.title
  };
}

export function newForm(today: string): TaskForm {
  return { editId: null, title: '', mode: 'once', when: 'today', date: addDays(today, 1), freq: 'daily', weekday: dowOf(today), interval: '2' };
}

export function editForm(t: Task, today: string): TaskForm {
  const when = t.type === 'once' && t.hasDate ? (t.dueDate === today ? 'today' : t.dueDate === addDays(today, 1) ? 'tomorrow' : 'date') : 'today';
  return {
    editId: t.id, title: t.title, mode: t.type === 'once' ? 'once' : 'repeat', when,
    date: t.type === 'once' && t.hasDate ? t.dueDate : addDays(today, 1),
    freq: t.type === 'once' ? 'daily' : t.type, weekday: t.weekday ?? dowOf(today), interval: String(t.interval || 2)
  };
}

export function ruleFromForm(f: TaskForm, today: string): Rule {
  const n = Math.max(1, Math.min(365, parseInt(f.interval, 10) || 1));
  if (f.mode === 'once') {
    const date = f.when === 'tomorrow' ? addDays(today, 1) : f.when === 'date' && f.date ? (f.date < today ? today : f.date) : today;
    return { type: 'once', weekday: f.weekday, interval: n, hasDate: f.when !== 'today', date };
  }
  return { type: f.freq, weekday: f.weekday, interval: n };
}

/** Create or update a task from the form. Returns null if the title is empty. */
export function saveTask(d: Data, f: TaskForm, today: string): { data: Data; dueDate: string } | null {
  const title = f.title.trim();
  if (!title) return null;
  const r = ruleFromForm(f, today);
  let dueDate = today;
  if (f.editId) {
    const tasks = d.tasks.map(t => {
      if (t.id !== f.editId) return t;
      if (r.type === 'once') dueDate = r.hasDate ? r.date! : (t.type === 'once' && !t.hasDate ? t.dueDate : today);
      else {
        const changed = t.type !== r.type || (r.type === 'weekly' && t.weekday !== r.weekday) || (r.type === 'interval' && t.interval !== r.interval);
        dueDate = changed ? firstDue(r, today) : t.dueDate;
      }
      const nt: Task = { ...t, ...r, title, dueDate };
      delete nt.date;
      return nt;
    });
    return { data: { ...d, tasks }, dueDate };
  }
  dueDate = firstDue(r, today);
  const t: Task = { id: 't' + d.nextId, title, createdAt: Date.now(), ...r, dueDate };
  delete t.date;
  return { data: { ...d, tasks: d.tasks.concat([t]), nextId: d.nextId + 1 }, dueDate };
}

export function saveGoal(d: Data, gf: GoalForm): Data | string {
  const T = parseInt(gf.target, 10) || 0;
  if (T < 1) return 'Das Endziel muss mindestens 1 Punkt sein.';
  const pending = parseInt(gf.add, 10);
  let ms = gf.ms.slice();
  if (pending > 0 && pending < T && !ms.includes(pending)) ms.push(pending);
  ms = ms.filter(m => m > 0 && m < T).sort((a, b) => a - b);
  return { ...d, goal: { target: T, milestones: ms, base: gf.isNew ? d.points : d.goal.base } };
}
