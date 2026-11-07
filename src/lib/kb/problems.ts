// Which problem a merged report belongs to. causes.ts places a report by its tenant and the way it
// came in; the desk's own reading (desk-notes.json) wins where it saw something else: a date that
// moved by one day is not a day/month swap, whatever the tenant writes.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

// The order the desk reads them in, and the order their tickets were filed in.
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  // How these reports came in: channel → count.
  channels: Record<string, number>;
  // What intake tagged them as: tag → count. A guess from the browser, kept to show how far off it is.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (keys: string[]) => keys.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

export type Split = { rows: number; merged: Report[]; groups: ProblemGroup[] };

// Every report merged into `ticket`, once, split by problem. `rows` is the export before de-duplication.
export function splitTicket(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const groups = PROBLEMS.map((problem) => {
    const reports = merged.filter((r) => problemOf(r, tenantOf(r), oneDayMove) === problem);
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
  }).filter((g) => g.reports.length > 0);
  return { rows: rows.length, merged, groups };
}
