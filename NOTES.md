# What this repo adds to the kb export

The first commit is the support desk's kb export exactly as received (`kb-export-267efc5e.zip`,
exported 2026-10-04). Everything after it is listed here.

## The page

- `src/routes/kb/incidents/4471/problems/+page.svx`: **#4471 · what the merged reports show**,
  signed by Kamil Kubowicz (desk ref `DR-K5PW-C79S`).
- `rendered/kb/incidents/4471/problems.html`: the same page as the desk sees it, built from the
  export and saved as one standalone HTML file.
- `src/lib/kb/problems.ts` and `src/lib/kb/ProblemSplit.svelte`: the logic and the table the page
  uses. The page types no counts; they are computed from `src/lib/data/` at render time.

## The tickets

One issue per problem in desk ticket #4471, each with the number of reports it covers:

- [#1](../../issues/1) `parser`: the shared parser reads dates month first
- [#2](../../issues/2) `hint`: booking-v3 tells day-first tenants to type the month first
- [#3](../../issues/3) `one-day`: invites move by one day (not a day/month swap)

## Build frame

The export ships only `src/` (`apps/kb/` in the desk's repo). To render it, this repo adds
`package.json`, `svelte.config.js`, `vite.config.js`, `src/app.html`, `src/routes/+layout.ts` and
`scripts/snapshot.mjs` (SvelteKit 2, Svelte 5, mdsvex, static adapter).

```sh
pnpm install
pnpm build                                  # every kb page -> build/
pnpm snapshot kb/incidents/4471/problems    # standalone copy -> rendered/
```

No existing kb page, component or data file was changed.
