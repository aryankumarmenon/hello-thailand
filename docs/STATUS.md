# Status

Update this file in the same pull request as the work. One owner per milestone. Milestone details are in
`PLAN.md`.

Last updated: 2026-09-19

## Pre-trip slice (target: early October 2026)

Scope set on 15 Sep 2026: ~29.5 hours of code by Aryan alone against a ~25-hour budget, so the M8 planner UI slips
first (see `DECISIONS.md`). Rows are in build order.

| #       | Milestone                                            | Owner | State                                                                                                                                                                                                                                                                                                                                                         |
| ------- | ---------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0      | Scaffold                                             | Aryan | Done 16 Sep 2026: CI `check` green; production live at `hello-thailand-planner.vercel.app` on Node 22.x and pnpm 10.34.5 (read from the Vercel build logs); preview deploy verified on PR #3; `pnpm test:deploy` smoke-checks production                                                                                                                      |
| M1      | Data pipeline with planner fields and geocoding      | Aryan | Done 19 Sep 2026: merged as PR #8, commit `272ca8b`, CI `check` green on `main`. Schemas, importer, geocoder, content validator and privacy lint, reworked after the three review agents. PR #10, commit `e728dbb`, finished the leftovers: Moon Bar pinned, ADR 0009 and ADR 0011 written. 39 Bangkok places, 37 pinned; the two unpinned are under Blockers |
| M2-lite | Tokens and the components M4 and M8 use, light theme | Aryan | Done 19 Sep 2026 on `m2-lite-components`. `ui/tokens.css`, `ui/fonts.ts`, and Button, Card, Chip, NumberBadge, FreshnessPill, Header. AA contrast is tested, not asserted: `ui/tokens.test.ts` reads the shipped CSS and computes every ratio through the role tokens the components use (14 tests, 131 total)                                                |
| M4      | Bangkok top-10 list and place pages                  | Aryan | Not started                                                                                                                                                                                                                                                                                                                                                   |
| M8      | Bangkok day planner with must-include places         | Aryan | Not started                                                                                                                                                                                                                                                                                                                                                   |
| M7-lite | Ship: production deploy, manual Lighthouse run       | Aryan | Not started                                                                                                                                                                                                                                                                                                                                                   |

Moved after the trip: landing (region map and chips), dark mode, trip inputs and estimate card, M5 photos, M6 Bangkok map, e2e and
Lighthouse CI jobs.

## Content track (runs beside the code)

| Item                                                                                  | Owner | State       |
| ------------------------------------------------------------------------------------- | ----- | ----------- |
| Bangkok top-10: rewrite, verified prices, traveller notes                             | Aryan | Not started |
| Planner data per Bangkok place: neighbourhood, popularity, time needed, opening hours | Aryan | Not started |
| Scam alerts for Bangkok                                                               | Aryan | Not started |

Moved after the trip, with the estimate card: cost tiers, season calendar, Andaman scam alerts.

## Next

- M1's leftovers merged as PR #10, commit `e728dbb`. M2-lite is on `m2-lite-components`.
- Next is M4 (Bangkok top-10 and place pages) on `m4-bangkok-pages`, then M8, then M7-lite.
- **M4 must also do three things that fell out of earlier work.** Render the
  "© OpenStreetMap contributors" credit, required by ADR 0011 and worded in `CONTEXT.md`. Close the
  `neighbourhood` enum, which the `Place` schema says arrives with M4. And decide how a permanently
  closed venue is represented: `studio-lam` shut at the end of February 2026, confirmed against the
  Bangkok Post, Resident Advisor and Time Out, and nothing in the schema can say so, so a top-10 or a
  day plan would happily feature it.

### What M1 built

| Piece                       | Where                                             | Notes                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Price` and `Place` schemas | `src/domain/schemas/`                             | A price cannot exist without a source URL and `checkedOn`. Editorial planner fields are optional, so an imported place is valid before anyone writes about it                                                                                                                            |
| CSV importer                | `scripts/import-csv.ts`                           | Reads `PLACES_CSV_PATH`. The allowlist is enforced at the parser: `Notes` never becomes a key. Re-running keeps editorial work and coordinates                                                                                                                                           |
| Geocoder                    | `scripts/geocode.ts`                              | Nominatim under ADR 0009: 1 request/second, identifying User-Agent, every answer cached so a re-run sends nothing. Refuses a result outside Thailand, or one sharing no word with the place name. Every pin records what it matched                                                      |
| Content validator           | `scripts/validate-content.ts`                     | Runs inside `pnpm check`. Checks every place, its file name against its id, duplicate ids, and the overrides file                                                                                                                                                                        |
| Privacy lint                | `scripts/privacy-lint.ts`, `.githooks/pre-commit` | Denylist read from the gitignored `.privacy-denylist` or the `PRIVACY_DENYLIST` CI secret. Reports file and line only, never the matched string. A missing denylist fails the pre-commit hook and fails CI; only a bare local run warns. Both the file and the repository secret are set |

Verification at the end of M1: `pnpm check && pnpm build` pass, 117 tests.

### What the review agents changed

`security-reviewer`, `content-reviewer` and `pr-readiness` all ran on this branch. Between them they found one
blocker and several real defects, all now fixed:

- **Private trip data in `tests/fixtures/places-with-notes.csv`** — the fixture had been written from real CSV
  rows, including a booked stay. It is invented throughout now, and the commit that introduced it was amended
  before the branch was ever pushed, so the strings are absent from the history that merged as PR #8.
- **A short CSV row shifted `Notes` into `Address`** — the allowlist reads columns by position, and
  `relax_column_count` let a malformed row through. The header and every row width are checked now.
- **Four pins were a different business from the record** — see the geocoder row above and ADR 0009.
- **Five schema holes** — a price source could be a `file://` path to the private research repo, `checkedOn`
  accepted a future date, a 24-hour venue could not be written, overlapping hours were accepted, and
  `neighbourhood` was a free string the planner would compare by exact equality.

## Blockers

- **No place has any editorial field.** All 39 carry only the CSV core and a coordinate: zero
  `neighbourhood`, `popularity`, `timeNeededMinutes`, `openingHours`, `summary`, and no verified price.
  M4 ranks a top-10 and M8 scores by popularity × interest and groups by neighbourhood, so both need
  this. Agreed on 19 Sep 2026: M4 sets `neighbourhood` (derived from the coordinates) and `popularity`
  (an editorial judgement, needing no source). Opening hours, prices and summaries stay with the content
  track, because each is a factual claim needing a source URL and `checkedOn`. `planDay` carries a
  documented default stop length rather than inventing `timeNeededMinutes` per place.
- **Two Bangkok places have no coordinates:** `likhit-kai-yang` and `roof-at-sala-rattanakosin`. Neither is in
  OpenStreetMap; each `skip` override records what was searched on 19 Sep 2026 so the work is not repeated.
  Read the coordinates off a map and replace the skip with a pin. `moon-bar-banyan-tree` is pinned now, on
  Banyan Tree Bangkok, matched by hotel name in OpenStreetMap. 37 of 39 places are pinned.
- **OpenStreetMap credit must render in M4 and M6:** ADR 0011 settled the licence — the cache and the
  `coordinates` and `geocode` fields are ODbL, the researched content is not — and requires "© OpenStreetMap
  contributors" to be visible on any page that shows a coordinate. `content/LICENSE` carries it today. The place
  page in M4 and the map in M6 MUST render it, and the M6 tile source adds its own credit on top.
- **Branch protection:** `main` is not protected. Set it in the GitHub repository settings: require a pull
  request, require the `check` job with the branch up to date, and require linear history.
- **Vercel connector:** it cannot see the `hello-thailand` Vercel scope, so Claude cannot read build logs or deployments.
  Reconnect it in claude.ai with access to that team.
- **Product name:** an unrelated visa agency already uses "HelloThailand" (`hello-thailand.vercel.app`). Decide the
  name before Reels and Reddit links go out on the trip; see `docs/DECISIONS.md`.
