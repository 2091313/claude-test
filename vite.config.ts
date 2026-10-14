import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Emits dist/sw.js with every build output and public file precached, versioned by their content. */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const files = [...Object.keys(bundle), ...readdirSync('public')].filter(f => f !== 'sw.js').sort();
      const hash = createHash('sha256');
      for (const f of files) {
        const out = bundle[f];
        hash.update(f);
        if (out) hash.update(out.type === 'chunk' ? out.code : out.source);
        else hash.update(readFileSync('public/' + f));
      }
      const source = readFileSync('sw/sw.js', 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(['./', ...files]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    }
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: './'
});
