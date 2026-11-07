// Copies a built kb page to rendered/ as one standalone file: the page as the desk sees it.
// CSS is already inlined by the build (inlineStyleThreshold), so the disabled stylesheet links and the
// script preloads go too. Scripts are dropped because every
// kb page is fully rendered at build time.
// Usage: pnpm build && pnpm snapshot kb/incidents/4471/problems
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

for (const page of process.argv.slice(2)) {
  const html = readFileSync(`build/${page}.html`, 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<link\b[^>]*\b(?:modulepreload|disabled)\b[^>]*>\s*/g, '');
  const out = `rendered/${page}.html`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`${out} (${html.length} bytes)`);
}
