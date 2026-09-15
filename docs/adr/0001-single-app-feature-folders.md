# 0001 — Single Next.js app with feature folders and enforced layers

- Status: accepted
- Date: 2026-09-15

## Context

One developer builds this part-time. The site has about six features (landing estimate, city explorer,
place, currency, guides, AI) plus data scripts. Logic such as the cost estimate and price freshness must be
testable without starting Next.js.

## Decision

- One Next.js app, not a monorepo. No second consumer of shared packages exists.
- `src/app` holds routes only. `src/features/<feature>` holds feature code. `src/domain` holds plain
  TypeScript logic and zod schemas. `src/ui` holds shared presentational components. `src/server` holds
  server-only code (AI, guards). `src/content` holds build-time loaders.
- Allowed direction: `app → features → ui/domain`. `domain` imports nothing from Next, React or outer
  layers. `ui` does not import features, server or content. `scripts/` never imports features, ui or app.
- ESLint `no-restricted-imports` overrides per folder enforce this. `tests/unit/import-boundaries.test.ts`
  proves the rules fire.

## Consequences

- Domain logic runs in Vitest in milliseconds and scripts can reuse it.
- A few more folders than a flat `lib/`. Relative imports that bypass the alias are still caught by the
  `**/<layer>/*` patterns.
- Rejected: pnpm monorepo (setup cost with one consumer); `eslint-plugin-boundaries` (extra plugin for five rules).
