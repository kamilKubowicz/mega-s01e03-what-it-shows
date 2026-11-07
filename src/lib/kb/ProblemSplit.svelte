<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem, type ProblemRow } from '#lib/kb/problems';

  // `issues`: where each problem is tracked now, problem → ticket URL.
  // `list`: problems whose reports are listed in full under the table.
  let {
    ticket,
    issues = {},
    list = [],
  }: { ticket: number; issues?: Partial<Record<Problem, string>>; list?: Problem[] } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const all = $derived([...split.causes, ...split.read]);
  const byCause = $derived(split.causes.reduce((n, g) => n + g.reports.length, 0));
  const counts = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
  const label = (url: string) => `#${url.split('/').pop()}`;
  const alsoIn = (g: ProblemRow) =>
    Object.entries(g.filedUnder ?? {})
      .map(([cause, n]) => `${n} filed under ${cause}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{all.length}</strong>
  {all.length === 1 ? 'problem' : 'problems'}
  <span class="rows">({split.rows} rows in the export; a report the export repeats is counted once)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>intake tagged as</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each all as g (g.problem)}
      <tr class:open={!issues[g.problem]} class:read={g.filedUnder}>
        <td><code>{g.problem}</code>{#if g.filedUnder}<span class="small">desk's reading</span>{/if}</td>
        <td>{g.reports.length}{#if g.filedUnder}<span class="small">{alsoIn(g)}</span>{/if}</td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}{#if g.tenants.length <= 5}<span class="small">{g.tenants.join(', ')}</span>{/if}</td>
        <td class="small">{counts(g.channels)}</td>
        <td class="small">{counts(g.taggedAs)}</td>
        <td class="small seen">{g.firstSeen} →<br />{g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}<a href={issues[g.problem]}>{label(issues[g.problem] ?? '')}</a>{:else}no ticket yet{/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td>by cause</td><td>{byCause}</td>
      <td colspan="5" class="small">
        {byCause === split.merged.length ? 'every merged report is in exactly one cause row' : 'cause rows do not add up — check causes.ts'}{#if split.read.length}; the desk's reading is counted again where it is filed, as on the desk's cause table{/if}
      </td>
    </tr>
  </tfoot>
</table>

{#each all.filter((g) => list.includes(g.problem)) as g (g.problem)}
  <table class="list">
    <caption>every <code>{g.problem}</code> report</caption>
    <thead><tr><th>report</th><th>tenant</th><th>by</th><th>what they wrote</th></tr></thead>
    <tbody>
      {#each g.reports as r (r.id)}
        <tr><td><code>{r.id}</code></td><td>{r.tenant}</td><td>{r.channel}</td><td>{r.body}</td></tr>
      {/each}
    </tbody>
  </table>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .rows { display: block; color: var(--muted); font-size: 0.8rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  td .small { display: block; }
  .seen { white-space: nowrap; }
  .open td:last-child { color: var(--warn); font-weight: 600; }
  .read td { border-top: 1px dashed var(--line); }
  tfoot td { font-weight: 600; border-bottom: none; }
  caption { text-align: left; color: var(--muted); font-size: 0.85rem; padding-bottom: 0.25rem; }
  .list td { vertical-align: top; }
  .list td:first-child { white-space: nowrap; }
</style>
