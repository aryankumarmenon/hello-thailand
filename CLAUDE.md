@AGENTS.md

# Hello Thailand

Solo project: Aryan owns every milestone. Start every session by reading `docs/STATUS.md`: it says what is
in progress and what is blocked.

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
- Test data is invented. A fixture, an example or a sample row MUST NOT be copied from the research CSV or
  the research repo, even one field of it. Realistic test data is a habit worth breaking here: a fixture only
  has to exercise the code, and inventing it costs nothing. This caught us once already — see ADR 0003.
- A safety check that reports it is not running is a blocker, not noise. If the privacy lint prints
  "no denylist ... Skipping", stop and fix that before committing anything else.
- Content: own words. A price carries a source URL and `checkedOn`; anything else is `unverified`. Photos
  come from licensed sources with credit.
- Hosting is Vercel Hobby, which is non-commercial: the site stays free of affiliate links, ads, payments
  and email capture until `docs/DECISIONS.md` says otherwise.
- Done means `pnpm check && pnpm build` pass, with the output shown.

## Working method

- Mark a milestone in progress in `docs/STATUS.md` before starting it. One milestone at a time.
- One branch per milestone (for example `m1-data-pipeline`), merged into `main` by pull request with CI green.
  Branch names, rebasing, merging and the review agents in `.claude/agents/` are in `docs/WORKFLOW.md`.
- Update `docs/STATUS.md` in the same pull request. A changed product decision goes in `docs/DECISIONS.md`, a
  changed technical decision becomes a new ADR, and `docs/PLAN.md` is updated to match.
- Commit with your personal GitHub identity.
