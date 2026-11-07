// The problems inside a merged ticket, counted the desk's way. Causes come from the desk's own
// cause table logic (groupByCause in causes.ts). On top of that, the desk's reading in
// desk-notes.json: a report the desk read as a one-day move is its own problem, and it stays
// counted where it is filed, as the desk's cause table counts it.
import { groupByCause, readAs, uniqueById, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = CauseGroup['cause'] | 'one-day';

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  // How these reports came in: channel → count.
  channels: Record<string, number>;
  // What intake tagged them as: tag → count. A guess from the browser, kept to show how far off it is.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Only for a problem the desk read on top of the causes: cause → how many of its reports are filed there.
  filedUnder?: Record<string, number>;
};

const tally = (keys: string[]) => keys.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

function row(problem: Problem, reports: Report[]): ProblemRow {
  const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports,
    tenants: [...new Set(reports.map((r) => r.tenant))].sort(),
    channels: tally(reports.map((r) => r.channel)),
    taggedAs: tally(reports.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export type Split = { rows: number; merged: Report[]; causes: ProblemRow[]; read: ProblemRow[] };

// Every report merged into `ticket`, once. `rows` is the export before de-duplication.
export function splitTicket(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const oneDay = merged.filter((r) => oneDayMove.includes(r.id));
  const filedUnder = Object.fromEntries(
    groups.map((g) => [g.cause, readAs(g, oneDayMove)] as const).filter(([, n]) => n > 0),
  );
  return {
    rows: rows.length,
    merged,
    causes: groups.map((g) => row(g.cause, g.reports)),
    read: oneDay.length ? [{ ...row('one-day', oneDay), filedUnder }] : [],
  };
}
