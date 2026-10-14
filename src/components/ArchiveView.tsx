import type { ArchiveEntry, Task } from '../lib/model';
import { diffDays, longDate, pad, ruleLabel, whenLabel } from '../lib/dates';

interface Props {
  today: string;
  archive: ArchiveEntry[];
  tasks: Task[];
  onRestore: (entryId: string) => void;
}

export function ArchiveView({ today, archive, tasks, onRestore }: Props) {
  const sorted = archive.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const groups: { day: string; label: string; items: ArchiveEntry[] }[] = [];
  sorted.forEach(e => {
    let g = groups[groups.length - 1];
    if (!g || g.day !== e.day) {
      const dd = diffDays(today, e.day);
      g = { day: e.day, label: dd === 0 ? 'Heute' : dd === 1 ? 'Gestern' : longDate(e.day), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  });

  const meta = (e: ArchiveEntry) => {
    const dt = new Date(e.completedAt);
    const live = e.type !== 'once' && tasks.find(t => t.id === e.taskId);
    const next = live && live.dueDate > today ? ' · wieder ' + whenLabel(live.dueDate, today) : '';
    return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' Uhr · ' + ruleLabel(e) + next;
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '2px solid var(--divider)' }}>
        <div className="eyebrow">{(archive.length === 1 ? '1 erledigt' : archive.length + ' erledigt') + ' · letzte 30 Tage'}</div>
        <h1 className="h1">Archiv</h1>
      </div>

      {groups.map(g => (
        <div key={g.day} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', background: 'var(--surface)' }}>
            <span className="section">{g.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{g.items.length}</span>
          </div>
          {g.items.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 72, padding: '10px 12px 10px 20px', borderBottom: '1px solid var(--divider)' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{a.title}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>{meta(a)}</span>
              </div>
              <button onClick={() => onRestore(a.id)} aria-label="Wiederherstellen" className="h-hover h-press" style={{ flex: 'none', height: 44, padding: '0 12px', border: '1px solid var(--divider)', background: 'transparent', color: 'var(--text)', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /></svg>
                Zurück
              </button>
            </div>
          ))}
        </div>
      ))}

      {groups.length === 0 && (
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Noch nichts erledigt.</div>
          <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 290, textWrap: 'pretty' } as React.CSSProperties}>Abgehakte Aufgaben landen hier und lassen sich wiederherstellen.</div>
        </div>
      )}

      <div style={{ padding: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Einträge werden nach 30 Tagen automatisch gelöscht.</div>
    </div>
  );
}
