# Decisions

Why the product is shaped the way it is. Decided in a structured interview and several research and review
passes on 15 Sep 2026. Technical decisions live in `adr/`; the resulting spec is in `PLAN.md`.

To change a decision: agree it between both owners, edit the row here with the new answer, the date and the reason,
then update `PLAN.md`. Rows under **Closed** stay closed unless a listed reopen condition is met.

## Frame

| Decision    | Answer                                                                         | Why                                                                                      |
| ----------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Goal        | Portfolio first, some income later                                             | A portfolio still pays off at ₹0 revenue                                                 |
| Money       | None before the October 2026 trip; decide afterwards, only if needed           | Keeps hosting free and scope small                                                       |
| Audience    | Indian travellers first; content and currency built so it can go global        | Underserved niche: ₹ context, veg food, Indian visa rules                                |
| Positioning | Tools first, verified and dated data                                           | Tools and dated facts survive AI search summaries; generic articles lose traffic to them |
| Cost        | ₹0 except live AI, hard cap $5/month                                           | Pet project                                                                              |
| Growth      | Reddit answers, Instagram Reels from the trip, SEO only for high-intent topics | Search-only growth is weak for new travel sites                                          |

## Scope

| Decision                             | Answer                                                                                      | Why                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Launch coverage                      | Bangkok and Andaman (Bangkok, Phuket, Krabi Town, Ao Nang/Railay, Ko Phi-Phi); Pattaya next | Research already exists for these                             |
| Other regions                        | Shown on the map, greyed "coming soon"                                                      | The map looks complete and no page is empty                   |
| Pre-trip slice                       | Landing, Bangkok list and place pages, photos, Bangkok map                                  | Full MVP is 135–185 h; the map was kept in at Aryan's request |
| Accounts                             | None until paid or community features                                                       | No login work, no personal data                               |
| Ask Hello Thailand                   | v2, after data is complete                                                                  | Largest cost and abuse surface; useless without full data     |
| Community recommendations, solo chat | Later roadmap                                                                               | Need accounts, moderation and legal work                      |

## Features

| Decision       | Answer                                                                                                | Why                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Landing        | Region map and trip inputs on the same page; inputs optional                                          | Users explore first; the estimate appears when they want it                         |
| Estimate       | Budget/mid/luxury ฿ ranges per day, tier fit, season warning; no itinerary                            | How good budget tools work; one number misleads                                     |
| Cost tier data | Public cost indexes, link and date per number, labelled "rough estimate"; replaced by real trip costs | The research had no generic tier data                                               |
| City page      | Docs-style sidebar, one combined ranked list, shareable URL; sidebar \| list \| map on desktop        | Aryan wanted a docs-like browse; numbered pins match list ranks                     |
| Map style      | Neutral real map (MapLibre + OpenFreeMap)                                                             | A game-style look was dropped; free and commercial-safe tiles avoid a later rebuild |
| Prices         | Stored and shown in ฿; a header switcher converts to the visitor's currency                           | ฿ is the real price; conversion is a convenience                                    |
| Stale prices   | Fresh < 90 days, aging 90–180, stale > 180                                                            | Sustainable re-check load for two people                                            |
| Guides         | Money; 7-Eleven, markets and malls; nightlife; history; vendors; scams — each filterable by city      | Matches what travellers ask; listicle format works                                  |
| Vendors        | Hand-reviewed shortlist with licence or certification number and `checkedOn`                          | Live review-count checks do not scale for two people                                |
| Gap content    | Research agent drafts with link and date; a person verifies                                           | Mall must-dos and vendor checks did not exist in the research                       |
| Want-to-go     | Browser storage only                                                                                  | No accounts; later feeds the planner                                                |

## AI

| Decision      | Answer                                                         | Why                                                                |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| AI-first      | Wherever it is cheap                                           | Aryan's direction                                                  |
| v1 features   | "Describe your trip" box; precomputed city blurbs              | Blurbs have no public endpoint; the describe box only fills a form |
| Model         | `claude-haiku-4-5` in one `MODEL_ID`; Sonnet 5 later if needed | Cheapest model that handles form filling and grounded answers      |
| Guardrails    | $5/month cap, 10 calls/visitor/day, Turnstile, kill switch     | A public endpoint can be abused by anyone                          |
| Build-time AI | Drafts, tagging, photo picks inside Claude Code, human-checked | ₹0 API cost                                                        |
| Two AI boxes  | Describe box merges into Ask when Ask ships                    | One AI surface at a time                                           |

## Content, photos, design, hosting

| Decision     | Answer                                                             | Why                                                                                  |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Content rule | Own words; price only with source and date; no guidebook text      | Trust is the product; copyright                                                      |
| Photos       | Licensed sources only, collected by script with licence and credit | India's Copyright Act has no pet-project exemption; a takedown could remove the site |
| Look         | Gen-Z bento, Thai flag palette (beige/navy/red)                    | Aryan's direction; red as accent avoids a government look                            |
| Fonts        | Fraunces or Space Grotesk + Inter                                  | Editorial headings, readable body                                                    |
| Hosting      | Vercel Hobby, non-commercial                                       | Free; the Vercel connector can deploy it                                             |
| Repo         | Public; code MIT, content all rights reserved                      | Portfolio visibility without giving away the research                                |

## Closed — do not reopen without the listed condition

| Item                                            | Status                               | Reopen only if                                               |
| ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| TDAC / visa helper tool                         | Dropped. Users use the official site | Never; volatile rules and it resembles fake paid TDAC sites  |
| GTA-5 map style                                 | Dropped for a neutral map            | Aryan asks again                                             |
| Scraping photos from Google, Instagram or blogs | Rejected                             | Never                                                        |
| Static PDF trip packs as the paid product       | Rejected for a personal plan review  | Evidence that PDFs sell                                      |
| Affiliate links, ads, payments on Vercel Hobby  | Not allowed by Hobby terms           | Site moves to Cloudflare Workers and monetisation is decided |
| Vendor rule "≥ 4.5★ from ≥ 200 reviews"         | Replaced by hand-reviewed shortlist  | Tooling makes review checks automatic                        |
| Waitlist or email capture                       | Not now                              | Accounts and DPDP consent exist                              |
