# Hello Thailand

A Thailand trip planner: pick regions on a map, get a rough per-day cost estimate,
and explore verified places with dated prices. Pet project, non-commercial.

## Stack

Next.js (App Router) and TypeScript, zod, Vitest, ESLint and Prettier, pnpm 10. Hosted on Vercel.

## Develop

```bash
pnpm install
pnpm dev
```

`pnpm check` runs lint, typecheck, unit tests and the format check. Run it with `pnpm build` before
calling a change done.

## Structure

`src/app` holds routes, `src/features` holds feature code, `src/domain` holds framework-free logic,
`src/ui` holds shared components. The layer rules are in `docs/adr/0001-single-app-feature-folders.md`
and are enforced by ESLint. Terms are defined in `docs/CONTEXT.md`.

Project context lives in `docs/`: `STATUS.md` (who is doing what), `PLAN.md` (what we build),
`DECISIONS.md` (why), `RESEARCH.md` (sources) and `adr/` (technical decisions).

## Licence

Code: MIT (`LICENSE`). Content in `content/`: all rights reserved (`content/LICENSE`).
