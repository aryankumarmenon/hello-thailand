@AGENTS.md

# Hello Thailand

Two-person project. Start every session by reading `docs/STATUS.md`: it says what is in progress, who owns
it, and what is blocked.

## Project docs — read when the task touches them

- `docs/PLAN.md` — what we build: product spec, architecture, milestones, roadmap. Read before starting or
  scoping any feature.
- `docs/DECISIONS.md` — why the product is shaped this way, and what is closed. Read before proposing a
  change to scope, features, stack, hosting or cost.
- `docs/adr/` — technical decisions. Read the matching ADR before changing structure, content schema, data
  import or AI.
- `docs/RESEARCH.md` — competitors, UX references, service terms and limits, costs, content gaps, with
  sources. Read when choosing a service, library or UI pattern, or when writing content.
- `docs/CONTEXT.md` — glossary. Use its terms in code, content and docs.
- Source research lives in a separate private repo. On a machine that has it, `CLAUDE.local.md` (gitignored)
  gives its local path and which research file answers which need. Read those files on demand; never copy
  the path, the repo name or research text into this public repo.

## Rules

- Layers: `app → features → ui/domain`. `domain/` is plain TypeScript and zod. `server/` is imported only by
  `app/` and server components. ESLint enforces this; fix the import and keep the rule.
- Private source data: import only Name, Region, Category and Address from the research CSV (ADR 0003). The
  CSV and the private research repo stay outside this repo.
- Content: own words. A price carries a source URL and `checkedOn`; anything else is `unverified`. Photos
  come from licensed sources with credit.
- Hosting is Vercel Hobby, which is non-commercial: the site stays free of affiliate links, ads, payments
  and email capture until `docs/DECISIONS.md` says otherwise.
- Done means `pnpm check && pnpm build` pass, with the output shown.

## Working together

- Claim a milestone in `docs/STATUS.md` before starting it. One owner per milestone.
- One branch per milestone (for example `m3-landing`), merged into `main` by pull request with CI green.
  Branch names, rebasing, merging and the review agents in `.claude/agents/` are in `docs/WORKFLOW.md`.
- Update `docs/STATUS.md` in the same pull request. A changed product decision goes in `docs/DECISIONS.md`, a
  changed technical decision becomes a new ADR, and `docs/PLAN.md` is updated to match.
- Commit with your personal GitHub identity.
