import type { Task } from '../lib/model';
import { diffDays, longDate, ruleLabel, whenLabel } from '../lib/dates';

interface Props {
  today: string;
  tasks: Task[];
  doneToday: number;
  checking: Record<string, boolean>;
  showUpcoming: boolean;
  onToggleUpcoming: () => void;
  onCheck: (id: string) => void;
  onEdit: (t: Task) => void;
}

const statLabel = { fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' } as const;
const statValue = { fontSize: 32, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as const;

export function TasksView({ today, tasks, doneToday, checking, showUpcoming, onToggleUpcoming, onCheck, onEdit }: Props) {
  const open = tasks.filter(t => t.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt - b.createdAt);
  const upcoming = tasks.filter(t => t.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '24px 20px 20px' }}>
        <div className="eyebrow">{longDate(today)}</div>
        <h1 className="h1">Aufgaben</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid var(--divider)', borderBottom: '2px solid var(--divider)' }}>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={statLabel}>Offen</span>
          <span style={statValue}>{open.length}</span>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '1px solid var(--divider)' }}>
          <span style={statLabel}>Heute erledigt</span>
          <span style={{ ...statValue, color: doneToday ? 'var(--accent)' : 'var(--text)' }}>{doneToday}</span>
        </div>
      </div>

      {open.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {open.map(t => <TaskRow key={t.id} t={t} today={today} checking={!!checking[t.id]} onCheck={onCheck} onEdit={onEdit} />)}
        </div>
      ) : (
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>Alles erledigt.</div>
          <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 280, textWrap: 'pretty' } as React.CSSProperties}>Tippe auf +, um eine neue Aufgabe hinzuzufügen.</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <button onClick={onToggleUpcoming} aria-expanded={showUpcoming} className="h-hover" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 20px', border: 'none', borderTop: '2px solid var(--divider)', borderBottom: '1px solid var(--divider)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>
            <span className="section">Demnächst · {upcoming.length}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ transform: showUpcoming ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {showUpcoming && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcoming.map(u => (
                <button key={u.id} onClick={() => onEdit(u)} className="h-hover" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 112px', alignItems: 'stretch', minHeight: 64, padding: 0, border: 'none', borderBottom: '1px solid var(--divider)', background: 'transparent', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '10px 12px 10px 20px', minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere', color: 'var(--muted)' }}>{u.title}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{ruleLabel(u)}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, padding: '10px 16px', borderLeft: '1px solid var(--divider)' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Fällig</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{whenLabel(u.dueDate, today)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ t, today, checking: c, onCheck, onEdit }: { t: Task; today: string; checking: boolean; onCheck: (id: string) => void; onEdit: (t: Task) => void }) {
  const dated = t.type !== 'once' || t.hasDate;
  const od = dated ? diffDays(today, t.dueDate) : 0;
  const due = od > 0 ? 'Überfällig seit ' + (od === 1 ? 'gestern' : od + ' Tagen') : dated ? 'Heute fällig' : '';
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 76, borderBottom: '1px solid var(--divider)', opacity: c ? 0.4 : 1, transition: 'opacity .25s ease', animation: 'rowIn .3s ease' }}>
      <button onClick={() => onCheck(t.id)} aria-label="Abhaken" style={{ width: 68, flex: 'none', border: 'none', background: 'transparent', padding: '0 0 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer', color: 'var(--accentInk)' }}>
        <span style={{ width: 28, height: 28, border: `2px solid ${c ? 'var(--accent)' : 'var(--text)'}`, background: c ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s,border-color .15s' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: c ? 1 : 0, transition: 'opacity .15s' }}><path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" /></svg>
        </span>
      </button>
      <button onClick={() => onEdit(t)} className="h-hover" style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: '14px 20px 14px 4px', color: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3, textDecoration: c ? 'line-through' : 'none', overflowWrap: 'anywhere' }}>{t.title}</span>
        <span style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{ruleLabel(t)}</span>
          {due && <span style={{ color: od > 0 ? 'var(--accentText)' : 'var(--muted)', fontWeight: 600 }}>· {due}</span>}
        </span>
      </button>
    </div>
  );
}
