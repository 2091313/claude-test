import type { RefObject } from 'react';
import type { Theme } from '../lib/model';
import { firstDue, longDate, shortDate, WD } from '../lib/dates';
import { ruleFromForm, type GoalForm, type TaskForm } from '../lib/actions';
import { field, IconArrow, IconClose, Seg, Sheet } from './ui';

const digits = (v: string, max: number) => v.replace(/[^0-9]/g, '').slice(0, max);
const primaryBtn = { height: 58, border: 'none', background: 'var(--accent)', color: 'var(--accentInk)', fontSize: 17, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', textAlign: 'left' } as const;
const stepBtn = (size: number) => ({ width: size, height: size, flex: 'none', border: 'none', background: 'var(--surface)', color: 'var(--text)', fontSize: 24, cursor: 'pointer' }) as const;
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function TaskSheet({ form: f, today, padBottom, titleRef, onChange, onSave, onDelete, onClose }: {
  form: TaskForm; today: string; padBottom: string; titleRef: RefObject<HTMLInputElement>;
  onChange: (p: Partial<TaskForm>) => void; onSave: () => void; onDelete: () => void; onClose: () => void;
}) {
  const r = ruleFromForm(f, today);
  const fd = firstDue(r, today);
  const previewLine = r.type === 'once'
    ? (fd === today ? 'Erscheint sofort auf dem Startbildschirm.' : 'Erscheint am ' + longDate(fd) + ' auf dem Startbildschirm – bis dahin unter „Demnächst“.')
    : (fd === today ? 'Heute fällig' : 'Erstmals fällig am ' + longDate(fd)) + '. Nach dem Abhaken erscheint die Aufgabe automatisch zum nächsten Termin wieder.';
  const iv = parseInt(f.interval, 10) || 0;

  return (
    <Sheet title={f.editId ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'} onClose={onClose} padBottom={padBottom}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <label style={field()}>
          <span className="label">Aufgabe</span>
          <input ref={titleRef} value={f.title} onChange={e => onChange({ title: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') onSave(); }} placeholder="Was steht an?" maxLength={80} enterKeyHint="done" className="f-accent"
            style={{ height: 56, width: '100%', padding: '0 14px', border: '2px solid var(--divider)', background: 'var(--surface)', color: 'var(--text)', caretColor: 'var(--accent)', fontSize: 18, fontWeight: 500, outline: 'none' }} />
        </label>

        <div style={field()}>
          <span className="label">Art</span>
          <Seg columns="1fr 1fr" value={f.mode} onChange={mode => onChange({ mode })} opts={[{ v: 'once', label: 'Einmalig' }, { v: 'repeat', label: 'Wiederkehrend' }]} />
        </div>

        {f.mode === 'once' && (
          <div style={field()}>
            <span className="label">Fällig</span>
            <Seg columns="repeat(3,1fr)" value={f.when} onChange={when => onChange({ when })} opts={[{ v: 'today', label: 'Heute' }, { v: 'tomorrow', label: 'Morgen' }, { v: 'date', label: 'Datum' }]} />
            {f.when === 'date' && (
              <input type="date" min={today} value={f.date} onChange={e => onChange({ date: e.target.value })} className="f-accent" aria-label="Datum"
                style={{ height: 52, width: '100%', padding: '0 14px', border: '2px solid var(--divider)', background: 'var(--surface)', color: 'var(--text)', fontSize: 16, fontWeight: 600, outline: 'none' }} />
            )}
          </div>
        )}

        {f.mode === 'repeat' && (
          <div style={field()}>
            <span className="label">Wiederholung</span>
            <Seg columns="repeat(3,1fr)" value={f.freq} onChange={freq => onChange({ freq })} btnStyle={{ fontSize: 14, padding: '0 12px' }}
              opts={[{ v: 'daily', label: 'Täglich' }, { v: 'weekly', label: 'Wöchentl.' }, { v: 'interval', label: 'Alle X Tage' }]} />
            {f.freq === 'weekly' && (
              <Seg columns="repeat(7,minmax(0,1fr))" style={{ marginTop: 6 }} value={f.weekday} onChange={weekday => onChange({ weekday })}
                btnStyle={{ fontSize: 14, padding: '0 0 0 8px', transition: undefined }} opts={WD_ORDER.map(w => ({ v: w, label: WD[w] }))} />
            )}
            {f.freq === 'interval' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 17, fontWeight: 600 }}>
                <span>Alle</span>
                <div style={{ display: 'flex', border: '2px solid var(--divider)' }}>
                  <button onClick={() => onChange({ interval: String(Math.max(1, (iv || 1) - 1)) })} aria-label="Weniger" className="h-hover" style={stepBtn(52)}>−</button>
                  <input type="number" inputMode="numeric" min={1} max={365} value={f.interval} onChange={e => onChange({ interval: digits(e.target.value, 3) })} aria-label="Tage"
                    style={{ width: 72, height: 52, border: 'none', borderLeft: '1px solid var(--divider)', borderRight: '1px solid var(--divider)', background: 'var(--bg)', color: 'var(--text)', textAlign: 'center', fontSize: 22, fontWeight: 800, outline: 'none' }} />
                  <button onClick={() => onChange({ interval: String(Math.min(365, iv + 1)) })} aria-label="Mehr" className="h-hover" style={stepBtn(52)}>+</button>
                </div>
                <span>{r.interval === 1 ? 'Tag' : 'Tage'}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>{previewLine}</div>

        <div style={{ display: 'flex', gap: 10 }}>
          {f.editId && (
            <button onClick={onDelete} className="h-tint" style={{ flex: 'none', height: 58, padding: '0 16px', border: '2px solid var(--divider)', background: 'transparent', color: 'var(--accentText)', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>Löschen</button>
          )}
          <button onClick={onSave} className="h-accent" style={{ ...primaryBtn, flex: 1, opacity: f.title.trim() ? 1 : 0.45, transition: 'opacity .15s,background .15s' }}>
            {f.editId ? 'Speichern' : 'Hinzufügen'}<IconArrow />
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export function GoalSheet({ gf, padBottom, onChange, onAdd, onSave, onClose }: {
  gf: GoalForm; padBottom: string; onChange: (p: Partial<GoalForm>) => void; onAdd: () => void; onSave: () => void; onClose: () => void;
}) {
  const T = parseInt(gf.target, 10) || 0;
  return (
    <Sheet title={gf.isNew ? 'Neues Ziel' : 'Ziele festlegen'} onClose={onClose} padBottom={padBottom}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={field()}>
          <span className="label">Endziel · volles Glas</span>
          <div style={{ display: 'flex', border: '2px solid var(--divider)' }}>
            <button onClick={() => onChange({ target: String(Math.max(5, Math.ceil(T / 5) * 5 - 5)) })} aria-label="Minus 5" className="h-hover" style={stepBtn(60)}>−</button>
            <input type="number" inputMode="numeric" min={1} value={gf.target} onChange={e => onChange({ target: digits(e.target.value, 5) })} aria-label="Endziel"
              style={{ flex: 1, minWidth: 0, height: 60, border: 'none', borderLeft: '1px solid var(--divider)', borderRight: '1px solid var(--divider)', background: 'var(--bg)', color: 'var(--text)', padding: '0 16px', fontSize: 28, fontWeight: 800, outline: 'none' }} />
            <button onClick={() => onChange({ target: String(Math.floor(T / 5) * 5 + 5) })} aria-label="Plus 5" className="h-hover" style={stepBtn(60)}>+</button>
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Punkte · ± in Schritten von 5</span>
        </div>

        <div style={field(10)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label">Zwischenziele</span>
            <button onClick={() => onChange({ ms: [...new Set([0.25, 0.5, 0.75].map(p => Math.round(T * p)).filter(v => v > 0 && v < T))] })} className="h-tint"
              style={{ height: 36, padding: '0 6px', border: 'none', background: 'none', color: 'var(--accentText)', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>¼ · ½ · ¾ setzen</button>
          </div>
          {gf.ms.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {gf.ms.map(m => (
                <button key={m} onClick={() => onChange({ ms: gf.ms.filter(x => x !== m) })} aria-label={`${m} entfernen`} className="h-border"
                  style={{ height: 44, padding: '0 10px 0 14px', border: '2px solid var(--divider)', background: 'var(--surface)', color: 'var(--text)', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  {m}<IconClose size={14} />
                </button>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Keine Zwischenziele – optional.</span>
          )}
          <div style={{ display: 'flex', border: '2px solid var(--divider)' }}>
            <input type="number" inputMode="numeric" min={1} value={gf.add} onChange={e => onChange({ add: digits(e.target.value, 5) })} onKeyDown={e => { if (e.key === 'Enter') onAdd(); }} placeholder="z. B. 40" aria-label="Zwischenziel"
              style={{ flex: 1, minWidth: 0, height: 52, padding: '0 14px', border: 'none', background: 'var(--surface)', color: 'var(--text)', fontSize: 17, fontWeight: 600, outline: 'none' }} />
            <button onClick={onAdd} style={{ flex: 'none', height: 52, padding: '0 16px', border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>Hinzufügen</button>
          </div>
          {gf.err && <span role="alert" style={{ fontSize: 14, color: 'var(--accentText)', fontWeight: 600 }}>{gf.err}</span>}
        </div>

        <button onClick={onSave} className="h-accent" style={primaryBtn}>{gf.isNew ? 'Neues Ziel starten' : 'Ziele speichern'}<IconArrow /></button>
      </div>
    </Sheet>
  );
}

export function SettingsSheet({ theme, today, dayOffset, confirmReset, padBottom, onTheme, onOffset, onReset, onClose }: {
  theme: Theme; today: string; dayOffset: number; confirmReset: boolean; padBottom: string;
  onTheme: (t: Theme) => void; onOffset: (n: number) => void; onReset: () => void; onClose: () => void;
}) {
  const btn = { height: 50, border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: '0 14px' } as const;
  return (
    <Sheet title="Einstellungen" onClose={onClose} padBottom={padBottom}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--divider)' }}>
        <span className="label">Darstellung</span>
        <Seg columns="repeat(3,1fr)" value={theme} onChange={onTheme} btnStyle={{ transition: undefined }}
          opts={[{ v: 'light', label: 'Hell' }, { v: 'dark', label: 'Dunkel' }, { v: 'system', label: 'System' }]} />
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span className="label">Testmodus</span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{shortDate(today) + (dayOffset ? ' (+' + dayOffset + ')' : '')}</span>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, textWrap: 'pretty' } as React.CSSProperties}>Zeit vorspulen, um Wiederholungen, Streak und das Löschen nach 30 Tagen auszuprobieren.</span>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', border: '2px solid var(--divider)' }}>
          <button onClick={() => onOffset(dayOffset + 1)} className="h-hover" style={btn}>+1 Tag</button>
          <button onClick={() => onOffset(dayOffset + 7)} className="h-hover" style={{ ...btn, borderLeft: '1px solid var(--divider)' }}>+7 Tage</button>
          {dayOffset > 0 && <button onClick={() => onOffset(0)} className="h-hover" style={{ ...btn, borderLeft: '1px solid var(--divider)', color: 'var(--accentText)' }}>Heute</button>}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onReset} style={{ height: 54, border: `2px solid ${confirmReset ? 'var(--accent)' : 'var(--divider)'}`, background: confirmReset ? 'var(--accent)' : 'transparent', color: confirmReset ? 'var(--accentInk)' : 'var(--accentText)', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: '0 16px' }}>
          {confirmReset ? 'Wirklich alles löschen? Erneut tippen' : 'Alle Daten löschen'}
        </button>
        <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Alle Daten werden nur lokal auf diesem Gerät gespeichert.</span>
      </div>
    </Sheet>
  );
}
