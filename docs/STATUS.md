# Status

Update this file in the same pull request as the work. One owner per milestone. Milestone details are in
`PLAN.md`.

Last updated: 2026-09-16

## Pre-trip slice (target: early October 2026)

Scope set on 15 Sep 2026: ~29.5 hours of code by Aryan alone against a ~25-hour budget, so the M8 planner UI slips
first (see `DECISIONS.md`). Rows are in build order.

| #       | Milestone                                            | Owner | State                                                                                                                    |
| ------- | ---------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| M0      | Scaffold                                             | Aryan | Done 16 Sep 2026: CI `check` green; production live at `hello-thailand-planner.vercel.app`; preview deploy live on PR #3 |
| M1      | Data pipeline with planner fields and geocoding      | Aryan | Not started. Only Aryan can run the CSV import: the source CSV is private and stays on his machine                       |
| M2-lite | Tokens and the components M4 and M8 use, light theme | Aryan | Not started                                                                                                              |
| M4      | Bangkok top-10 list and place pages                  | Aryan | Not started                                                                                                              |
| M8      | Bangkok day planner with must-include places         | Aryan | Not started                                                                                                              |
| M7-lite | Ship: production deploy, manual Lighthouse run       | Aryan | Not started                                                                                                              |

Moved after the trip: landing (region map and chips), dark mode, trip inputs and estimate card, M5 photos, M6 Bangkok map, e2e and
Lighthouse CI jobs.

## Content track (runs beside the code)

| Item                                                                                  | Owner | State       |
| ------------------------------------------------------------------------------------- | ----- | ----------- |
| Bangkok top-10: rewrite, verified prices, traveller notes                             | Aryan | Not started |
| Planner data per Bangkok place: neighbourhood, popularity, time needed, opening hours | Aryan | Not started |
| Scam alerts for Bangkok                                                               | Aryan | Not started |

Moved after the trip, with the estimate card: cost tiers, season calendar, Andaman scam alerts.

## Blockers

- **Vercel connector:** it cannot see the `hello-thailand` Vercel scope, so Claude cannot read build logs or deployments.
  Reconnect it in claude.ai with access to that team.
- **Collaborator access:** add the second person as a collaborator on the GitHub repo. Vercel Hobby has no team
  members, so they review preview deployments through Shareable Links.
- **Product name:** an unrelated visa agency already uses "HelloThailand" (`hello-thailand.vercel.app`). Decide the
  name before Reels and Reddit links go out on the trip; see `docs/DECISIONS.md`.
