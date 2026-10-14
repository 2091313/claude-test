import type { Theme } from './model';

// Gold is the only colour outside the Modernist design system — used for reached goals.
const GOLD = { gold: 'oklch(0.8 0.14 82)', goldInk: '#3a2900' };

const THEMES: Record<'light' | 'dark', Record<string, string>> = {
  light: { page: '#d7d3d3', frame: '#111010', bg: '#f3f2f2', surface: '#eae9e9', text: '#201e1d', muted: 'color-mix(in srgb, #201e1d 64%, transparent)', divider: 'color-mix(in srgb, #201e1d 40%, transparent)', hover: 'color-mix(in srgb, #201e1d 7%, transparent)', press: 'color-mix(in srgb, #201e1d 14%, transparent)', accent: '#ec3013', accentHover: '#dd2b0f', accentPress: '#ae1800', accentInk: '#f3f2f2', accentText: '#ae1800', accentTint: '#fff2ef', toast: '#201e1d', toastText: '#f3f2f2', scrim: 'color-mix(in srgb, #2d2b2b 50%, transparent)', shadowMd: '0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent)', shadowLg: '0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent)', ...GOLD },
  dark: { page: '#0b0a0a', frame: '#000000', bg: '#1a1817', surface: '#242120', text: '#f3f2f2', muted: 'color-mix(in srgb, #f3f2f2 64%, transparent)', divider: 'color-mix(in srgb, #f3f2f2 32%, transparent)', hover: 'color-mix(in srgb, #f3f2f2 7%, transparent)', press: 'color-mix(in srgb, #f3f2f2 14%, transparent)', accent: '#ff563c', accentHover: '#ff9783', accentPress: '#ff9783', accentInk: '#1a1817', accentText: '#ff9783', accentTint: 'color-mix(in srgb, #ff563c 16%, transparent)', toast: '#f3f2f2', toastText: '#1a1817', scrim: 'color-mix(in srgb, #000 60%, transparent)', shadowMd: '0 0 0 1px rgba(255,255,255,.06), 0 3px 10px rgba(0,0,0,.5)', shadowLg: '0 0 0 1px rgba(255,255,255,.08), 0 12px 32px rgba(0,0,0,.6)', ...GOLD }
};

export const systemDark = () => !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function applyTheme(th: Theme) {
  const dark = th === 'dark' || (th === 'system' && systemDark());
  const v = dark ? THEMES.dark : THEMES.light;
  const s = document.documentElement.style;
  Object.keys(v).forEach(k => s.setProperty('--' + k, v[k]));
  s.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v.bg);
}
