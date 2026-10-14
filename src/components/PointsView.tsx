import type { Data } from '../lib/model';
import { addDays, dowOf, streakOf, WD } from '../lib/dates';
import { cycleOf } from '../lib/actions';
import { IconArrow } from './ui';

interface Props {
  data: Data;
  today: string;
  /** False for one frame on entering the tab so the liquid animates up from empty. */
  glassReady: boolean;
  onOpenGoal: () => void;
}

const pill = { height: 26, padding: '0 8px', fontWeight: 800, fontSize: 13.5, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', transition: 'background .6s,color .6s' } as const;

export function PointsView({ data: s, today, glassReady, onOpenGoal }: Props) {
  const g = s.goal, cycle = cycleOf(s), done = cycle >= g.target;
  const pct = Math.min(100, (cycle / g.target) * 100);
  const ms = g.milestones.filter(m => m < g.target);
  const markers = ms.map(m => {
    const r = cycle >= m;
    return { m, label: r ? '✓ ' + m : String(m), bottom: (m / g.target * 100) + '%', pillBg: r ? 'var(--gold)' : 'var(--surface)', pillFg: r ? 'var(--goldInk)' : 'var(--text)', line: r ? 'var(--gold)' : 'var(--divider)' };
  });
  const nextMs = ms.find(m => m > cycle);
  const reachedMs = ms.filter(m => cycle >= m).length;
  const left = g.target - cycle;
  const statusLine = done ? 'Geschafft! Dein Endziel ist erreicht.' : 'Noch ' + left + (left === 1 ? ' Punkt' : ' Punkte') + ' bis zum vollen Glas.';
  const goalStats = [
    { label: 'Nächstes Ziel', value: done ? '—' : String(nextMs || g.target) },
    { label: 'Zwischenziele', value: reachedMs + ' / ' + ms.length },
    { label: 'Fortschritt', value: Math.floor(pct) + ' %' }
  ];
  const liquid = done ? 'var(--gold)' : 'var(--accent)';

  const streak = streakOf(s.days, today);
  const todayDone = !!s.days[today];
  const week = [6, 5, 4, 3, 2, 1, 0].map(i => {
    const k = addDays(today, -i);
    return { k, i, has: !!s.days[k], label: WD[dowOf(k)] };
  });
  const streakHint = streak === 0 ? 'Erledige heute eine Aufgabe, um einen neuen Streak zu starten.'
    : todayDone ? 'Stark. Morgen geht’s weiter – lass keinen Tag aus.'
      : 'Erledige heute noch eine Aufgabe, sonst startet dein Streak wieder bei 0.';

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '2px solid var(--divider)' }}>
        <div className="eyebrow">{g.base > 0 ? 'Insgesamt ' + s.points + ' Punkte' : 'Aktueller Punktestand'}</div>
        <h1 className="h1">Punkte</h1>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 88, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', color: done ? 'var(--gold)' : 'var(--text)', transition: 'color .6s' }}>{cycle}</span>
        <span style={{ fontSize: 22, color: 'var(--muted)', fontWeight: 600 }}>/ {g.target}</span>
      </div>
      <div style={{ padding: '8px 20px 24px', fontSize: 15, lineHeight: 1.45, color: done ? 'var(--text)' : 'var(--muted)', fontWeight: 600, textWrap: 'pretty' } as React.CSSProperties}>{statusLine}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', borderTop: '2px solid var(--divider)', borderBottom: '2px solid var(--divider)' }}>
        <div style={{ padding: '44px 20px 24px' }}>
          <div role="img" aria-label={`Glas: ${cycle} von ${g.target} Punkten`} style={{ position: 'relative', width: 108, height: 320, marginRight: 62 }}>
            <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--text)', borderTopWidth: 0, background: 'var(--surface)', overflow: 'hidden', boxShadow: done ? '0 0 0 4px color-mix(in srgb, var(--gold) 35%, transparent), 0 14px 40px -6px color-mix(in srgb, var(--gold) 70%, transparent)' : 'none', transition: 'box-shadow .8s' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (glassReady ? pct : 0) + '%', background: liquid, transition: 'height 1.3s cubic-bezier(.3,.9,.3,1),background-color .8s' }}>
                {cycle > 0 && <>
                  <div style={{ position: 'absolute', left: '50%', top: -10, width: 440, height: 440, marginLeft: -220, borderRadius: '43%', background: liquid, opacity: 0.4, animation: 'spin 12s linear infinite', transition: 'background-color .8s' }} />
                  <div style={{ position: 'absolute', left: '50%', top: -5, width: 420, height: 420, marginLeft: -210, borderRadius: '42%', background: liquid, animation: 'spin 8s linear infinite reverse', transition: 'background-color .8s' }} />
                </>}
              </div>
              {markers.map(m => (
                <div key={m.m} style={{ position: 'absolute', left: 0, right: 0, bottom: m.bottom, height: 2, marginBottom: -1, background: m.line, transition: 'background .6s' }} />
              ))}
            </div>
            {markers.map(m => (
              <div key={m.m} style={{ position: 'absolute', left: '100%', bottom: m.bottom, transform: 'translateY(50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 10, height: 2, background: m.line }} />
                <span style={{ ...pill, minWidth: 48, gap: 4, background: m.pillBg, color: m.pillFg }}>{m.label}</span>
              </div>
            ))}
            <div style={{ position: 'absolute', left: '100%', bottom: '100%', transform: 'translateY(50%)', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 10, height: 2, background: 'var(--text)' }} />
              <span style={{ ...pill, whiteSpace: 'nowrap', background: done ? 'var(--gold)' : 'var(--text)', color: done ? 'var(--goldInk)' : 'var(--bg)' }}>{g.target}</span>
            </div>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--divider)', display: 'flex', flexDirection: 'column' }}>
          {goalStats.map(st => (
            <div key={st.label} style={{ padding: 16, borderBottom: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{st.label}</span>
              <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{st.value}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {done ? (
            <button onClick={onOpenGoal} style={{ margin: 16, minHeight: 56, border: 'none', background: 'var(--gold)', color: 'var(--goldInk)', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 14px', textAlign: 'left', cursor: 'pointer' }}>Neues Ziel<IconArrow size={18} /></button>
          ) : (
            <button onClick={onOpenGoal} className="h-hover" style={{ margin: 16, minHeight: 52, border: '1px solid var(--divider)', background: 'transparent', color: 'var(--text)', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 14px', textAlign: 'left', cursor: 'pointer' }}>Ziele bearbeiten<IconArrow size={18} /></button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="section">Streak</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{streak}</span>
              <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>{streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}</span>
            </span>
          </div>
          {todayDone && (
            <span style={{ height: 28, padding: '0 10px', background: 'var(--accentTint)', color: 'var(--accentText)', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', display: 'flex', alignItems: 'center' }}>HEUTE ✓</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', border: '2px solid var(--divider)' }}>
          {week.map(d => (
            <div key={d.k} style={{ display: 'flex', flexDirection: 'column', borderLeft: d.i === 6 ? 'none' : '1px solid var(--divider)' }}>
              <div style={{ height: 44, background: d.has ? 'var(--accent)' : 'transparent', transition: 'background .3s' }} />
              <span style={{ height: 26, display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 12, fontWeight: d.i === 0 ? 800 : 600, color: d.i === 0 ? 'var(--text)' : 'var(--muted)', borderTop: '1px solid var(--divider)' }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, textWrap: 'pretty' } as React.CSSProperties}>{streakHint}</div>
      </div>
    </div>
  );
}
