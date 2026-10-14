import { useEffect, useReducer, useRef, useState } from 'react';
import { DAY, pad, whenLabel, ymd } from './lib/dates';
import { DEFAULT_GOAL, load, save, serialize, UNDO_MS, type Data, type Task } from './lib/model';
import { applyTheme } from './lib/theme';
import * as A from './lib/actions';
import { TasksView } from './components/TasksView';
import { ArchiveView } from './components/ArchiveView';
import { PointsView } from './components/PointsView';
import { GoalSheet, SettingsSheet, TaskSheet } from './components/Sheets';

type Tab = 'tasks' | 'archive' | 'points';
type SheetKind = 'task' | 'goal' | 'settings' | null;
interface Toast { msg: string; undoId: string | null; key: number }

export function App() {
  // Persisted data lives in a ref as well so timers and chained actions always see the latest value.
  const [data, setDataState] = useState<Data>(() => { const d = load(); applyTheme(d.theme); return d; });
  const dataRef = useRef(data);
  const setData = (next: Data) => { if (next !== dataRef.current) { dataRef.current = next; setDataState(next); } };

  const [tab, setTab] = useState<Tab>('tasks');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [form, setFormState] = useState<A.TaskForm | null>(null);
  const [gf, setGfState] = useState<A.GoalForm | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [glassReady, setGlassReady] = useState(false);
  const [glassNonce, setGlassNonce] = useState(0);
  const [vp, setVp] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  const [, tick] = useReducer((n: number) => n + 1, 0);

  const titleRef = useRef<HTMLInputElement>(null);
  const toastT = useRef<number>();
  const resetT = useRef<number>();
  const checkingRef = useRef<Record<string, boolean>>({});

  const now = () => new Date(Date.now() + (dataRef.current.dayOffset || 0) * DAY);
  const today = ymd(new Date(Date.now() + (data.dayOffset || 0) * DAY));
  const purge = () => setData(A.purge(dataRef.current, ymd(now())));

  // Persist after every change.
  const savedJson = useRef('');
  useEffect(() => {
    const json = serialize(data);
    if (json !== savedJson.current) { savedJson.current = json; save(json); }
  }, [data]);

  // Theme, incl. following the OS setting in "System" mode.
  useEffect(() => {
    applyTheme(data.theme);
    if (data.theme !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = () => applyTheme('system');
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, [data.theme]);

  useEffect(() => {
    const onResize = () => setVp({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', onResize);
    // Clock, day rollover and the 30-day archive cleanup.
    const iv = window.setInterval(() => { purge(); tick(); }, 30000);
    return () => { window.removeEventListener('resize', onResize); clearInterval(iv); clearTimeout(toastT.current); clearTimeout(resetT.current); };
  }, []);
  useEffect(purge, [data.dayOffset]);

  // Glass fills up from empty a moment after it is shown.
  useEffect(() => {
    if (!glassNonce) return;
    const t = window.setTimeout(() => setGlassReady(true), 60);
    return () => clearTimeout(t);
  }, [glassNonce]);
  const replayGlass = () => { setGlassReady(false); setGlassNonce(n => n + 1); };

  // Focus the title when the add sheet opens (after its slide-in).
  const addOpen = sheet === 'task' && !!form && !form.editId;
  useEffect(() => {
    if (!addOpen) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [addOpen]);

  const showToast = (msg: string, undoId?: string) => {
    clearTimeout(toastT.current);
    const key = Date.now() + Math.random();
    setToast({ msg, undoId: undoId || null, key });
    toastT.current = window.setTimeout(() => setToast(t => (t && t.key === key ? null : t)), undoId ? UNDO_MS : 2600);
  };

  const check = (id: string) => {
    if (checkingRef.current[id]) return;
    checkingRef.current = { ...checkingRef.current, [id]: true };
    setChecking(checkingRef.current);
    // Let the tick + strike-through show briefly before the row leaves the list.
    window.setTimeout(() => {
      const c = { ...checkingRef.current }; delete c[id];
      checkingRef.current = c; setChecking(c);
      const res = A.complete(dataRef.current, id, now());
      if (!res) return;
      setData(res.data);
      showToast(res.msg, res.entryId);
    }, 260);
  };

  const revert = (entryId: string, fromArchive: boolean) => {
    const res = A.revert(dataRef.current, entryId, fromArchive, ymd(now()));
    if (!res) return;
    setData(res.data);
    if (fromArchive) showToast('„' + res.title + '“ wiederhergestellt · −1 Punkt');
    else { clearTimeout(toastT.current); setToast(null); }
  };

  const closeSheet = () => { setSheet(null); setConfirmReset(false); };
  const openAdd = () => { setFormState(A.newForm(ymd(now()))); setSheet('task'); };
  const openEdit = (t: Task) => { setFormState(A.editForm(t, ymd(now()))); setSheet('task'); };
  const setForm = (p: Partial<A.TaskForm>) => setFormState(f => f && { ...f, ...p });

  const saveTask = () => {
    if (!form) return;
    const t = ymd(now());
    const res = A.saveTask(dataRef.current, form, t);
    if (!res) { titleRef.current?.focus(); return; }
    setData(res.data);
    setSheet(null);
    if (res.dueDate > t) showToast((form.editId ? 'Gespeichert' : 'Geplant') + ' · fällig ' + whenLabel(res.dueDate, t));
  };
  const deleteTask = () => {
    if (!form?.editId) return;
    const id = form.editId;
    setData({ ...dataRef.current, tasks: dataRef.current.tasks.filter(t => t.id !== id) });
    setSheet(null);
    showToast('Aufgabe gelöscht');
  };

  const openGoal = () => {
    const d = dataRef.current, g = d.goal;
    const names = { ...g.names };
    const targetName = names[g.target] || '';
    delete names[g.target];
    setGfState({ target: String(g.target), ms: g.milestones.slice(), add: '', err: '', isNew: A.cycleOf(d) >= g.target, names, targetName, addName: '' });
    setSheet('goal');
  };
  const setGf = (p: Partial<A.GoalForm>) => setGfState(g => g && { ...g, err: '', ...p });
  const addMs = () => {
    if (!gf) return;
    const v = parseInt(gf.add, 10), T = parseInt(gf.target, 10) || 0;
    if (!v || v < 1) return setGf({ err: 'Bitte eine Zahl größer als 0 eingeben.' });
    if (T && v >= T) return setGf({ err: 'Zwischenziele müssen kleiner als das Endziel (' + T + ') sein.' });
    if (gf.ms.includes(v)) return setGf({ err: v + ' ist schon eingetragen.' });
    setGf({ ms: gf.ms.concat([v]).sort((a, b) => a - b), add: '', addName: '', names: { ...gf.names, [v]: gf.addName } });
  };
  const saveGoal = () => {
    if (!gf) return;
    const res = A.saveGoal(dataRef.current, gf);
    if (typeof res === 'string') return setGf({ err: res });
    setData(res);
    setSheet(null);
    replayGlass();
    showToast(gf.isNew ? 'Neues Ziel festgelegt – los geht’s!' : 'Ziele gespeichert');
  };

  const go = (t: Tab) => { setTab(t); if (t === 'points') replayGlass(); };

  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      clearTimeout(resetT.current);
      resetT.current = window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    setData({ ...dataRef.current, tasks: [], archive: [], points: 0, days: {}, dayOffset: 0, nextId: 10, goal: { ...DEFAULT_GOAL, names: {} } });
    setConfirmReset(false);
    setSheet(null);
    showToast('Alle Daten gelöscht');
  };

  // Phone frame on large screens (as in the design); edge-to-edge on real phones.
  const framed = !(vp.vw < 520 || vp.vh < 640);
  const sheetPad = framed ? '22px' : 'max(12px, env(safe-area-inset-bottom))';
  const clock = new Date();

  const navBtn = (k: Tab, label: string, icon: JSX.Element, first = false) => (
    <button onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined} className="h-hover" style={{ position: 'relative', height: 68, border: 'none', borderLeft: first ? 'none' : '1px solid var(--divider)', background: 'none', color: tab === k ? 'var(--text)' : 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 5, padding: '0 16px', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, letterSpacing: '.02em' }}>
      <span style={{ position: 'absolute', left: 0, right: 0, top: -2, height: 4, background: tab === k ? 'var(--accent)' : 'transparent' }} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">{icon}</svg>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page)', transition: 'background .3s' }}>
      <div style={{
        position: 'relative', width: framed ? 412 : '100vw', height: framed ? Math.min(892, vp.vh - 48) : '100dvh', borderRadius: framed ? 34 : 0,
        boxShadow: framed ? '0 0 0 10px var(--frame), 0 0 0 11px #3a3838, 0 40px 90px -20px rgba(0,0,0,.45)' : 'none',
        overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', transition: 'background .3s,color .3s'
      }}>
        {framed && (
          <div aria-hidden style={{ flex: 'none', height: 34, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, position: 'relative' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pad(clock.getHours())}:{pad(clock.getMinutes())}</span>
            <span style={{ position: 'absolute', left: '50%', top: 9, width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: 'var(--frame)' }} />
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
              <span style={{ width: 3, height: 5, background: 'currentColor' }} /><span style={{ width: 3, height: 8, background: 'currentColor' }} /><span style={{ width: 3, height: 11, background: 'currentColor' }} />
              <span style={{ width: 20, height: 11, marginLeft: 6, border: '1.5px solid currentColor', padding: 1.5, display: 'flex' }}><span style={{ width: '70%', background: 'currentColor' }} /></span>
            </span>
          </div>
        )}

        <header style={{ flex: 'none', height: 56, padding: '0 8px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--divider)', paddingTop: framed ? 0 : 'env(safe-area-inset-top)', boxSizing: 'content-box' }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>Taskmanager</span>
          <button onClick={() => setSheet('settings')} aria-label="Einstellungen" className="h-hover" style={{ width: 48, height: 48, border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M4 7h16" /><path d="M4 17h16" /><rect x="7" y="4.5" width="5" height="5" fill="var(--bg)" /><rect x="12" y="14.5" width="5" height="5" fill="var(--bg)" /></svg>
          </button>
        </header>

        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {tab === 'tasks' && (
            <TasksView today={today} tasks={data.tasks} doneToday={data.days[today] || 0} checking={checking}
              showUpcoming={showUpcoming} onToggleUpcoming={() => setShowUpcoming(v => !v)} onCheck={check} onEdit={openEdit} />
          )}
          {tab === 'archive' && <ArchiveView today={today} archive={data.archive} tasks={data.tasks} onRestore={id => revert(id, true)} />}
          {tab === 'points' && <PointsView data={data} today={today} glassReady={glassReady} onOpenGoal={openGoal} />}
        </main>

        {tab === 'tasks' && (
          <button onClick={openAdd} aria-label="Neue Aufgabe" className="h-accent" style={{ position: 'absolute', right: 20, bottom: (toast ? 170 : 100) + (framed ? 22 : 0), marginBottom: framed ? 0 : 'env(safe-area-inset-bottom)', zIndex: 20, width: 68, height: 68, border: 'none', background: 'var(--accent)', color: 'var(--accentInk)', boxShadow: 'var(--shadowMd)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'bottom .25s ease,background .15s' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square"><path d="M12 4v16" /><path d="M4 12h16" /></svg>
          </button>
        )}

        {toast && (
          <div role="status" style={{ position: 'absolute', left: 12, right: 12, bottom: (framed ? 22 : 0) + 84, marginBottom: framed ? 0 : 'env(safe-area-inset-bottom)', zIndex: 30, background: 'var(--toast)', color: 'var(--toastText)', overflow: 'hidden', boxShadow: 'var(--shadowLg)', animation: 'toastIn .22s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 60, padding: '8px 8px 8px 16px' }}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{toast.msg}</span>
              {toast.undoId && (
                <button onClick={() => revert(toast.undoId!, false)} style={{ flex: 'none', height: 44, padding: '0 14px', border: 'none', background: 'var(--accent)', color: 'var(--accentInk)', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>Rückgängig</button>
              )}
            </div>
            {toast.undoId && <div key={toast.key} style={{ height: 3, background: 'var(--accent)', transformOrigin: 'left', animation: `shrink ${UNDO_MS}ms linear forwards` }} />}
          </div>
        )}

        <nav style={{ flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '2px solid var(--divider)', background: 'var(--bg)', zIndex: 25, paddingBottom: framed ? 0 : 'env(safe-area-inset-bottom)' }}>
          {navBtn('tasks', 'Aufgaben', <><rect x="3.5" y="3.5" width="17" height="17" /><path d="M8 12.2l2.8 2.8 5.4-5.5" /></>, true)}
          {navBtn('archive', 'Archiv', <><rect x="3" y="4" width="18" height="5" /><path d="M5 9v11h14V9" /><path d="M10 13h4" /></>)}
          {navBtn('points', 'Punkte', <><path d="M6 3h12v18H6z" /><path d="M6 12h12" /></>)}
        </nav>
        {framed && (
          <div aria-hidden style={{ flex: 'none', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><span style={{ width: 108, height: 4, borderRadius: 2, background: 'var(--text)', opacity: 0.8 }} /></div>
        )}

        {sheet === 'task' && form && (
          <TaskSheet form={form} today={today} padBottom={sheetPad} titleRef={titleRef} onChange={setForm} onSave={saveTask} onDelete={deleteTask} onClose={closeSheet} />
        )}
        {sheet === 'goal' && gf && (
          <GoalSheet gf={gf} padBottom={sheetPad} onChange={setGf} onAdd={addMs} onSave={saveGoal} onClose={closeSheet} />
        )}
        {sheet === 'settings' && (
          <SettingsSheet theme={data.theme} today={today} dayOffset={data.dayOffset} confirmReset={confirmReset} padBottom={sheetPad}
            onTheme={theme => setData({ ...dataRef.current, theme })} onOffset={dayOffset => setData({ ...dataRef.current, dayOffset })}
            onReset={resetAll} onClose={closeSheet} />
        )}
      </div>
    </div>
  );
}
