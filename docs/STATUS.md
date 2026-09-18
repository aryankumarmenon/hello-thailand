# Status

Update this file in the same pull request as the work. One owner per milestone. Milestone details are in
`PLAN.md`.

Last updated: 2026-09-18

## Pre-trip slice (target: early October 2026)

Scope set on 15 Sep 2026: ~29.5 hours of code by Aryan alone against a ~25-hour budget, so the M8 planner UI slips
first (see `DECISIONS.md`). Rows are in build order.

| #       | Milestone                                            | Owner | State                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0      | Scaffold                                             | Aryan | Done 16 Sep 2026: CI `check` green; production live at `hello-thailand-planner.vercel.app` on Node 22.x and pnpm 10.34.5 (read from the Vercel build logs); preview deploy verified on PR #3; `pnpm test:deploy` smoke-checks production |
| M1      | Data pipeline with planner fields and geocoding      | Aryan | In progress on `m1-data-pipeline`. Schemas, importer, geocoder, content validator and privacy lint all written and green. 39 Bangkok places committed, 35 with coordinates. Two things left, both listed under Blockers                  |
| M2-lite | Tokens and the components M4 and M8 use, light theme | Aryan | Not started                                                                                                                                                                                                                              |
| M4      | Bangkok top-10 list and place pages                  | Aryan | Not started                                                                                                                                                                                                                              |
| M8      | Bangkok day planner with must-include places         | Aryan | Not started                                                                                                                                                                                                                              |
| M7-lite | Ship: production deploy, manual Lighthouse run       | Aryan | Not started                                                                                                                                                                                                                              |

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
  `content/overrides/geocode.json`. `pnpm geocode --city=bangkok` prints the exact lines to paste.
- Then M2-lite (tokens and the components M4 uses) on branch `m2-lite-components`.

### What M1 built

| Piece                       | Where                                             | Notes                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Price` and `Place` schemas | `src/domain/schemas/`                             | A price cannot exist without a source URL and `checkedOn`. Editorial planner fields are optional, so an imported place is valid before anyone writes about it                                   |
| CSV importer                | `scripts/import-csv.ts`                           | Reads `PLACES_CSV_PATH`. The allowlist is enforced at the parser: `Notes` never becomes a key. Re-running keeps editorial work and coordinates                                                  |
| Geocoder                    | `scripts/geocode.ts`                              | Nominatim, 1 request/second, identifying User-Agent, every answer cached in `content/geocode-cache.json` so a re-run sends nothing. Refuses a result outside Thailand                           |
| Content validator           | `scripts/validate-content.ts`                     | Runs inside `pnpm check`. Checks every place, its file name against its id, duplicate ids, and the overrides file                                                                               |
| Privacy lint                | `scripts/privacy-lint.ts`, `.githooks/pre-commit` | Denylist read from the gitignored `.privacy-denylist` or the `PRIVACY_DENYLIST` CI secret. Reports file and line only, never the matched string. Missing denylist warns locally and fails in CI |

Verification: `pnpm check && pnpm build` pass, 94 tests.

## Blockers

- **Privacy denylist is empty:** `.privacy-denylist` has only its instructions, so the pre-commit hook warns and
  skips. Add the real strings, and set the same list as the `PRIVACY_DENYLIST` repository secret so CI runs it.
- **Four Bangkok places have no coordinates:** `ban-baat-monk-s-bowl-village`, `bang-kachao`, `likhit-kai-yang`
  and `wtf-bar-and-gallery`. OpenStreetMap does not know them. Read the coordinates off a map and paste them into
  `content/overrides/geocode.json`.
- **Branch protection:** `main` is not protected. Set it in the GitHub repository settings: require a pull
  request, require the `check` job with the branch up to date, and require linear history.
- **Vercel connector:** it cannot see the `hello-thailand` Vercel scope, so Claude cannot read build logs or deployments.
  Reconnect it in claude.ai with access to that team.
- **Product name:** an unrelated visa agency already uses "HelloThailand" (`hello-thailand.vercel.app`). Decide the
  name before Reels and Reddit links go out on the trip; see `docs/DECISIONS.md`.
