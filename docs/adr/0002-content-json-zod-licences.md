# 0002 — Content as committed JSON validated by zod; split licences

- Status: accepted
- Date: 2026-09-15

## Context

The site's value is checked, dated information. About 130 places and a few guides do not need a CMS or
database. Code should be reusable as a portfolio piece, but the researched content should not be copied.

## Decision

- Places, cities, cost tiers and vendors are JSON files in `content/`, reviewed in git.
- Zod schemas in `src/domain/schemas` are the single source of truth. Types come from `z.infer`. The same
  schemas validate content at build and in CI, and later shape AI structured output.
- A price is either verified (`thb`, `label`, `checkedOn`, `source`) or `{ status: "unverified" }`. There is
  no way to store a number without a source.
- Records carry a stable `id` and a `source` of `editorial` or `community`, so later user content can join
  lists without a migration.
- Code is MIT (`LICENSE`). Content is all rights reserved (`content/LICENSE`).

## Consequences

- Invalid content fails the build instead of reaching users.
- Editing content means editing JSON; acceptable at this size. Revisit when community content arrives.
- Rejected: headless CMS (extra service); database now (no accounts yet).
