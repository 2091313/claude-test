import { describe, expect, it } from 'vitest';
import { complete, newForm, purge, revert, saveGoal, saveTask } from './actions';
import { firstDue, nextDue, streakOf } from './dates';
import type { Data, Task } from './model';

const T = '2026-10-13'; // a Tuesday
const at = (day: string, h = 12) => new Date(day + 'T' + String(h).padStart(2, '0') + ':00:00');
const task = (p: Partial<Task>): Task => ({ id: 't1', title: 'X', createdAt: 1, dueDate: T, type: 'once', weekday: 2, interval: 2, ...p });
const data = (p: Partial<Data> = {}): Data => ({
  tasks: [], archive: [], points: 0, days: {}, theme: 'light', dayOffset: 0, nextId: 10,
  goal: { target: 100, milestones: [25, 50, 75], base: 0 }, ...p
});

describe('recurrence', () => {
  it('computes next due dates', () => {
    expect(nextDue({ type: 'daily', weekday: 0, interval: 1 }, T)).toBe('2026-10-14');
    expect(nextDue({ type: 'interval', weekday: 0, interval: 3 }, T)).toBe('2026-10-16');
    expect(nextDue({ type: 'weekly', weekday: 2, interval: 1 }, T)).toBe('2026-10-20'); // same weekday → next week
    expect(nextDue({ type: 'weekly', weekday: 6, interval: 1 }, T)).toBe('2026-10-17');
  });
  it('schedules weekly tasks for the coming weekday', () => {
    expect(firstDue({ type: 'weekly', weekday: 2, interval: 1 }, T)).toBe(T);
    expect(firstDue({ type: 'weekly', weekday: 1, interval: 1 }, T)).toBe('2026-10-19');
  });
});

describe('complete / revert', () => {
  it('archives a one-off task and awards a point', () => {
    const r = complete(data({ tasks: [task({})] }), 't1', at(T))!;
    expect(r.data.tasks).toHaveLength(0);
    expect(r.data.archive[0]).toMatchObject({ taskId: 't1', day: T });
    expect(r.data.points).toBe(1);
    expect(r.data.days[T]).toBe(1);
  });
  it('reschedules a recurring task', () => {
    const r = complete(data({ tasks: [task({ type: 'daily' })] }), 't1', at(T))!;
    expect(r.data.tasks[0].dueDate).toBe('2026-10-14');
    expect(r.msg).toBe('Erledigt · +1 · wieder morgen');
  });
  it('announces milestones and the final goal', () => {
    const d = data({ tasks: [task({})], points: 24 });
    expect(complete(d, 't1', at(T))!.msg).toBe('Zwischenziel 25 erreicht!');
    expect(complete({ ...d, points: 99 }, 't1', at(T))!.msg).toBe('Endziel erreicht – das Glas ist voll!');
  });
  it('undo restores the task with its previous due date and removes the point', () => {
    const c = complete(data({ tasks: [task({ type: 'daily', dueDate: '2026-10-12' })] }), 't1', at(T))!;
    const r = revert(c.data, c.entryId, false, T)!.data;
    expect(r.tasks[0].dueDate).toBe('2026-10-12');
    expect(r.points).toBe(0);
    expect(r.archive).toHaveLength(0);
    expect(r.days[T]).toBeUndefined();
  });
  it('restoring from the archive brings a one-off task back due today', () => {
    const c = complete(data({ tasks: [task({ hasDate: true, dueDate: '2026-10-10' })] }), 't1', at(T))!;
    const r = revert(c.data, c.entryId, true, '2026-10-15')!.data;
    expect(r.tasks[0]).toMatchObject({ id: 't1', dueDate: '2026-10-15', hasDate: false });
  });
});

describe('archive purge', () => {
  it('drops entries after 30 days', () => {
    const c = complete(data({ tasks: [task({})] }), 't1', at(T))!.data;
    expect(purge(c, '2026-11-11')).toBe(c);
    expect(purge(c, '2026-11-12').archive).toHaveLength(0);
  });
});

describe('streak', () => {
  it('counts consecutive days and tolerates an empty today', () => {
    const days = { '2026-10-11': 1, '2026-10-12': 2 };
    expect(streakOf(days, T)).toBe(2);
    expect(streakOf({ ...days, [T]: 1 }, T)).toBe(3);
    expect(streakOf(days, '2026-10-14')).toBe(0);
  });
});

describe('forms', () => {
  it('creates tasks and rejects empty titles', () => {
    const f = { ...newForm(T), title: '  Lesen ' };
    const r = saveTask(data(), f, T)!;
    expect(r.data.tasks[0]).toMatchObject({ id: 't10', title: 'Lesen', type: 'once', dueDate: T });
    expect(saveTask(data(), newForm(T), T)).toBeNull();
  });
  it('starts a new goal cycle from the current points', () => {
    const r = saveGoal(data({ points: 100 }), { target: '50', ms: [10, 60], add: '20', err: '', isNew: true }) as Data;
    expect(r.goal).toEqual({ target: 50, milestones: [10, 20], base: 100 });
    expect(saveGoal(data(), { target: '0', ms: [], add: '', err: '', isNew: false })).toBeTypeOf('string');
  });
});
