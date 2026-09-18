# Status

Update this file in the same pull request as the work. One owner per milestone. Milestone details are in
`PLAN.md`.

Last updated: 2026-09-19

## Pre-trip slice (target: early October 2026)

Scope set on 15 Sep 2026: ~29.5 hours of code by Aryan alone against a ~25-hour budget, so the M8 planner UI slips
first (see `DECISIONS.md`). Rows are in build order.

| #       | Milestone                                            | Owner | State                                                                                                                                                                                                                                               |
| ------- | ---------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0      | Scaffold                                             | Aryan | Done 16 Sep 2026: CI `check` green; production live at `hello-thailand-planner.vercel.app` on Node 22.x and pnpm 10.34.5 (read from the Vercel build logs); preview deploy verified on PR #3; `pnpm test:deploy` smoke-checks production            |
| M1      | Data pipeline with planner fields and geocoding      | Aryan | In progress on `m1-data-pipeline`. Schemas, importer, geocoder, content validator and privacy lint written and green, then reworked after the three review agents. 39 Bangkok places, 36 pinned. ADR 0009 written. Remaining work is under Blockers |
| M2-lite | Tokens and the components M4 and M8 use, light theme | Aryan | Not started                                                                                                                                                                                                                                         |
| M4      | Bangkok top-10 list and place pages                  | Aryan | Not started                                                                                                                                                                                                                                         |
| M8      | Bangkok day planner with must-include places         | Aryan | Not started                                                                                                                                                                                                                                         |
| M7-lite | Ship: production deploy, manual Lighthouse run       | Aryan | Not started                                                                                                                                                                                                                                         |

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

- Finish M1: fill `.privacy-denylist`, and add the four missing coordinates to
- Merge `docs-solo-owner` **before** this branch, so `main` never has a STATUS without the collaborator
  blocker while five other files still describe a two-person project.
- Then M2-lite (tokens and the components M4 uses) on branch `m2-lite-components`.

### What M1 built

| Piece                       | Where                                             | Notes                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Price` and `Place` schemas | `src/domain/schemas/`                             | A price cannot exist without a source URL and `checkedOn`. Editorial planner fields are optional, so an imported place is valid before anyone writes about it                                                                       |
| CSV importer                | `scripts/import-csv.ts`                           | Reads `PLACES_CSV_PATH`. The allowlist is enforced at the parser: `Notes` never becomes a key. Re-running keeps editorial work and coordinates                                                                                      |
| Geocoder                    | `scripts/geocode.ts`                              | Nominatim under ADR 0009: 1 request/second, identifying User-Agent, every answer cached so a re-run sends nothing. Refuses a result outside Thailand, or one sharing no word with the place name. Every pin records what it matched |
| Content validator           | `scripts/validate-content.ts`                     | Runs inside `pnpm check`. Checks every place, its file name against its id, duplicate ids, and the overrides file                                                                                                                   |
| Privacy lint                | `scripts/privacy-lint.ts`, `.githooks/pre-commit` | Denylist read from the gitignored `.privacy-denylist` or the `PRIVACY_DENYLIST` CI secret. Reports file and line only, never the matched string. Missing denylist warns locally and fails in CI                                     |

Verification: `pnpm check && pnpm build` pass, 115 tests.

### What the review agents changed

`security-reviewer`, `content-reviewer` and `pr-readiness` all ran on this branch. Between them they found one
blocker and several real defects, all now fixed:

- **Private trip data in `tests/fixtures/places-with-notes.csv`** — the fixture had been written from real CSV
  rows, including a booked stay. It is invented throughout now, and the commit that introduced it was amended so
  the strings never reach a pushed history. The branch was never pushed.
- **A short CSV row shifted `Notes` into `Address`** — the allowlist reads columns by position, and
  `relax_column_count` let a malformed row through. The header and every row width are checked now.
- **Four pins were a different business from the record** — see the geocoder row above and ADR 0009.
- **Five schema holes** — a price source could be a `file://` path to the private research repo, `checkedOn`
  accepted a future date, a 24-hour venue could not be written, overlapping hours were accepted, and
  `neighbourhood` was a free string the planner would compare by exact equality.

## Blockers

- **Privacy denylist is empty:** `.privacy-denylist` has only its instructions, so the pre-commit hook warns and
  skips. Add the real strings, and set the same list as the `PRIVACY_DENYLIST` repository secret so CI runs it.
- **Three Bangkok places have no coordinates:** `likhit-kai-yang`, `moon-bar-banyan-tree` and
  `roof-at-sala-rattanakosin`. OpenStreetMap has no record of the first two and answers wrongly for the third;
  each carries a `skip` override saying so. Read the coordinates off a map and replace the skip with a pin.
- **OpenStreetMap attribution and licence:** every coordinate is OSM-derived and `content/geocode-cache.json`
  reproduces OSM `display_name` strings, but `content/LICENSE` reserves all rights over `content/`. OSM is ODbL:
  attribution is required, and share-alike applies to a derived database. Decide the position before M6 puts a
  map on the page. See ADR 0009.
- **Branch protection:** `main` is not protected. Set it in the GitHub repository settings: require a pull
  request, require the `check` job with the branch up to date, and require linear history.
- **Vercel connector:** it cannot see the `hello-thailand` Vercel scope, so Claude cannot read build logs or deployments.
  Reconnect it in claude.ai with access to that team.
- **Product name:** an unrelated visa agency already uses "HelloThailand" (`hello-thailand.vercel.app`). Decide the
  name before Reels and Reddit links go out on the trip; see `docs/DECISIONS.md`.
