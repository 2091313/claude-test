import type { CSSProperties, ReactNode } from 'react';

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'square' as const };

export const IconClose = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={size < 16 ? 3 : 2.4}><path d="M5 5l14 14" /><path d="M19 5L5 19" /></svg>
);
export const IconArrow = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
);

export interface SegOpt<T> { v: T; label: string }

/** Modernist segmented control: hard-edged grid, selected cell filled with the accent. */
export function Seg<T extends string | number>({ opts, value, onChange, columns, btnStyle, style }: {
  opts: SegOpt<T>[]; value: T; onChange: (v: T) => void; columns: string; btnStyle?: CSSProperties; style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns, border: '2px solid var(--divider)', ...style }}>
      {opts.map((o, i) => {
        const on = o.v === value;
        return (
          <button key={String(o.v)} onClick={() => onChange(o.v)} aria-pressed={on} style={{
            height: 50, border: 'none', borderLeft: i ? '1px solid var(--divider)' : 'none',
            background: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--accentInk)' : 'var(--text)',
            fontSize: 15, fontWeight: 800, textAlign: 'left', padding: '0 14px', cursor: 'pointer', transition: 'background .15s',
            ...btnStyle
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/** Bottom sheet over a scrim; tapping the scrim closes it. */
export function Sheet({ title, onClose, padBottom, children }: { title: string; onClose: () => void; padBottom: string; children: ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'var(--scrim)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn .2s ease' }}>
      <div role="dialog" aria-label={title} onClick={e => e.stopPropagation()} style={{ width: '100%', maxHeight: '92%', overflowY: 'auto', background: 'var(--bg)', borderTop: '2px solid var(--text)', animation: 'sheetUp .3s cubic-bezier(.2,.9,.3,1)', display: 'flex', flexDirection: 'column', paddingBottom: padBottom }}>
        <div style={{ height: 60, flex: 'none', padding: '0 8px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--divider)' }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.015em' }}>{title}</h2>
          <button onClick={onClose} aria-label="Schließen" className="h-hover" style={{ width: 48, height: 48, border: 'none', background: 'none', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IconClose /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const field = (gap = 8): CSSProperties => ({ display: 'flex', flexDirection: 'column', gap });
