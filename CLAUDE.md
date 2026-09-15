@AGENTS.md

# Hello Thailand — project rules

- Glossary: `docs/CONTEXT.md`. Decisions: `docs/adr/`.
- Layers: `app → features → ui/domain`. `domain/` is framework-free. `server/` is imported only by `app/` and
  server components. ESLint enforces this; do not disable the rule to get past it.
- Private source data: the research CSV's `Notes` column must never be read. Import only Name, Region,
  Category, Address. Never copy files from the private research repo.
- Content: own words only. A price is shown only with a source URL and `checkedOn`; otherwise it is unverified.
  No guidebook text. Photos only from licensed sources with credit.
- Hosting is Vercel Hobby (non-commercial): no affiliate links, ads, payments or email capture.
- Before calling work done, run `pnpm check && pnpm build` and show the output.
