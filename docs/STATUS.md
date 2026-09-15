# Status

Update this file in the same pull request as the work. One owner per milestone. Milestone details are in
`PLAN.md`.

Last updated: 2026-09-15

## Pre-trip slice (target: early October 2026)

| #   | Milestone                           | Owner | State                                                                                              |
| --- | ----------------------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| M0  | Scaffold                            | Aryan | Pushed; CI `check` green on `main`. Only the Vercel preview deploy is left, see below              |
| M1  | Data pipeline                       | Aryan | Not started. Only Aryan can run the CSV import: the source CSV is private and stays on his machine |
| M2  | Tokens and core components          | —     | Not started                                                                                        |
| M3  | Landing: region map and estimate    | —     | Not started                                                                                        |
| M4  | Bangkok top-10 list and place pages | —     | Not started                                                                                        |
| M5  | Photos pipeline                     | —     | Not started                                                                                        |
| M6  | Bangkok map                         | —     | Not started                                                                                        |
| M7  | Ship                                | —     | Not started                                                                                        |

## Content track (runs beside the code)

| Item                                                                             | Owner | State       |
| -------------------------------------------------------------------------------- | ----- | ----------- |
| Bangkok top-10: rewrite, verified prices, Indian-traveller notes                 | —     | Not started |
| Scam alerts for Bangkok and Andaman                                              | —     | Not started |
| Cost tiers for Bangkok and Andaman from public indexes, link and date per number | —     | Not started |
| Season calendar (Andaman ferries, rain)                                          | —     | Not started |

## Blockers

- **Vercel:** not linked. The Vercel connector returns no teams, so linking the GitHub repo needs either an import
  at vercel.com/new or a reconnected connector.
- **Collaborator access:** add the second person as a collaborator on the GitHub repo and the Vercel project.
