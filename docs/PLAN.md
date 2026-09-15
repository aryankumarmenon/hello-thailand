# Plan

What we build and in what order. Why each choice was made is in `DECISIONS.md`; technical decisions are in
`adr/`; progress is in `STATUS.md`.

## Frame

Hello Thailand is a Thailand trip planner for Indian travellers first, global later. It is a pet and
portfolio project: no revenue before the October 2026 field trip, and monetisation only if needed afterwards.
It is AI-first where AI is cheap. Running cost is ₹0 except live AI, capped at $5 a month.

The whole MVP is estimated at 135–185 hours, so work ships as a priority-ordered **pre-trip slice** (~40 hours of
code plus a content track), then continues after the trip.

## Product spec

### Landing

- Hero line, then an inline SVG map of Thailand's six regions. Bangkok and Andaman are selectable; North, Isaan,
  Central and Gulf are greyed "coming soon", visibly disabled, and a tap shows a toast.
- Region chips stay in sync with the map.
- Optional inputs: dates, days, travellers, budget per person. The map works before any input.
- Live **estimate** card: budget, mid and luxury ฿ ranges per day for the chosen regions, which tier the budget
  fits, and a season warning (for example Andaman ferries in October). Labelled "rough estimate", with a link and
  date per number. It is not an itinerary.
- Andaman's Explore button says "city pages coming soon" until its cities exist.
- Post-trip: a "Describe your trip" AI box that fills the inputs from free text.

### City page

- Cities: Bangkok first; then Phuket, Krabi Town, Ao Nang/Railay, Ko Phi-Phi.
- Docs-style sidebar (like Anthropic or Mintlify docs): topics → subtopics as checkboxes, two levels, drawn with
  the site's own chip and card components. Neighbourhood is an extra filter.
- Selections merge into one ranked list (default top 10) with applied-filter chips, Clear all, a result count and a
  shareable URL such as `/bangkok?topics=temples,rooftop-bars`. The list never shows empty: relax a facet and say so.
- Desktop: sidebar | list | sticky map with numbered pins that match list numbers.
- Mobile: a Filters pill at the top opens a bottom sheet; one floating Map/List button.
- Cross-links: a sidebar topic links to its full guide; a guide item links to the place on the map.
- "Stays — coming soon" tab.
- Post-trip: a one-line AI blurb for the current selection, precomputed at build time.

### Place page

- Licensed photo with credit, or a branded placeholder.
- Price in ฿ with a freshness pill (fresh < 90 days, aging 90–180, stale > 180) or a neutral "not yet verified" pill.
- Hours, time needed, best time to go.
- Indian-traveller notes: veg and Jain options, dress code, how to pay.
- Scam-alert box.
- Want-to-go toggle stored in the browser.

### Currency switcher (post-trip)

Header dropdown, default ฿, converts every price, with a "converted from ฿" note. Rates: Frankfurter (ECB) at build
time with 24-hour revalidation, then the fawazahmed0 currency API, then a committed snapshot. When rates fail,
show the last rate and "rates delayed".

### Guides (post-trip)

- Bento hub: one 2×2 hero (money or scams), two 2×1, three 1×1.
- Guides: travel money; 7-Eleven, markets and malls (must-do per mall); clubbing and nightlife; history and
  information; activity vendors; scams.
- A guide page is a numbered listicle with a photo per item and sticky single-select city chips. "All" is the
  default; items outside the chosen city are greyed at the bottom.
- Vendors: a hand-reviewed shortlist, each with a licence or certification number (TAT; PADI or SSI for diving) and
  `checkedOn`. No paid listings.

### AI

- v1: "Describe your trip" box on the landing page, and precomputed city-selection blurbs.
- v2: "Ask Hello Thailand", a Q&A that answers only from site data and links the places it used. It absorbs the
  describe box as its first suggested prompt.
- Model `claude-haiku-4-5`, named in one `MODEL_ID` constant so Sonnet 5 can replace it.
- Guardrails: $5/month cap set in the Anthropic Console; 10 calls per visitor per day (Upstash Redis, key = HMAC
  of IP with a daily salt); Cloudflare Turnstile; `AI_ENABLED` kill switch that falls back to the plain form. IP and
  question are never logged together.
- Build-time AI (drafts, topic tagging, photo picks) runs in Claude Code sessions and is checked by a person.

### Content and photos

- Own words. A price is shown only with a source URL and date. No guidebook text.
- Gap content (cost tiers, mall must-dos, vendors) is drafted by research agents with link and date, then verified
  by a person.
- Photos come from a script that queries licensed sources only (Wikimedia Commons, Openverse, Unsplash hotlinked
  with attribution and download ping, Pexels) and stores licence and credit.

### Design

- Gen-Z, bento, sticker badges, light motion.
- Colour: beige `#F5EFE4` 60%, navy `#2D2A4A` 30%, Thai red `#A51931` 10%, white. Dark mode uses navy `#1E1C33` as
  the base; red is a fill or border there, never text (2.2:1 contrast).
- Type: Fraunces or Space Grotesk for headings, Inter for body; woff2, Latin subset.
- Shared primitives: one Card, one Chip, one NumberBadge (map pins, list ranks and listicle numbers), one Sticker.
- Performance budget: ≤ 170 KB JS gzipped per route; fonts ≤ 80 KB; thumbnails ≤ 35 KB; hero ≤ 120 KB; MapLibre
  loaded only on city pages.
- Edge states: estimate placeholder before input; zero results → Clear all and nearby picks; AI limit → reset time;
  AI off → "browse guides" card; missing photo → branded placeholder.

### Hosting

Vercel Hobby at `hello-thailand.vercel.app`. Code stays portable to Cloudflare Workers through OpenNext: Node
runtime only, no Vercel-only SDKs, images `unoptimized`.

## Architecture

Single Next.js 16 app. Rules and reasons are in `adr/0001`–`0003`; later ADRs cover the rest.

```
src/
  app/        routes only: page.tsx, [city]/page.tsx, [city]/[place]/page.tsx, guides/[slug]/, api/{parse-trip,ask}/
  features/   landing-estimate/ city-explorer/ place/ currency/ guides/ ask-ai/
  domain/     schemas/ estimate/ ranking/ fx/ freshness/ filters/   plain TS + zod, tests beside source
  content/    build-time loaders (fs + zod)
  server/     ai/ guard/{rate-limit,turnstile,kill-switch} fx/      every file imports "server-only"
  ui/         components/ tokens.css fonts.ts
  env/        server.ts client.ts                                   @t3-oss/env-nextjs + zod
content/      places/<city>/*.json cities/ cost-tiers/ vendors/ guides/*.mdx overrides/geocode.json
scripts/      import-csv geocode photos/ privacy-lint validate-content stale-prices
tests/        unit/ e2e/ fixtures/ lighthouse/
docs/         PLAN STATUS DECISIONS RESEARCH CONTEXT adr/
```

- Schemas in `src/domain/schemas` are the single source of truth for content, loaders and AI structured output.
- Price: `{ thb, label, checkedOn, source }` or `{ status: "unverified" }`. Records carry a stable `id` and
  `source: "editorial" | "community"`.
- Key functions: `estimateTrip(input, costs, seasons)`, `rankPlaces(places, { topics, neighbourhoods })`,
  `convertPrice(price, to, fx)`, `freshness(price, now)`, `parseTripDescription(text)`, `askGrounded(question)`,
  `rateLimit(visitorKey)`, `verifyTurnstile(token)`. AI functions return `Result<T, AiError>`.
- Guides MDX: Content Collections after a 1-hour Turbopack spike; fallback `@next/mdx`.
- Tooling: pnpm 10 (pinned), ESLint flat config + Prettier, TypeScript strict with `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`, Vitest 5, Playwright, GitHub Actions, Dependabot.
- Planned ADRs: 0004 static-first and portability; 0005 THB prices and client-side freshness; 0006 FX fallback
  chain; 0007 AI module and one `MODEL_ID`; 0008 AI guardrails; 0009 maps and build-time geocoding.

## Milestones

### Pre-trip (~40 hours, in priority order; unfinished work continues after the trip)

| #   | Hours | Work                                                                                                                                                                      | Done when                                                                                                       |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| M0  | 3     | Scaffold: pnpm pin, strict tsconfig, layer lint, Vitest, CI `check` job, glossary, ADRs 0001–0003                                                                         | CI green; preview deploy live                                                                                   |
| M1  | 5     | Data pipeline: CSV import (column allowlist, BOM, drop Sleep rows), schemas, validate-content, privacy lint + pre-commit hook, Nominatim geocode with cache and overrides | Bangkok JSON committed; fixture test proves the Notes column never reaches output                               |
| M2  | 4     | Tokens and core components (Button, Card, Chip, Toast, Sticker, NumberBadge, inputs, Header), light and dark, fonts                                                       | AA contrast in both themes                                                                                      |
| M3  | 6     | Landing: SVG region map, synced chips, inputs, estimate card, season warning, coming-soon states                                                                          | `estimateTrip` unit tests; Playwright landing test                                                              |
| M4  | 6     | Bangkok top-10 list and place pages (static), PriceBadge, freshness, want-to-go                                                                                           | Static pages built; want-to-go survives a reload in e2e                                                         |
| M5  | 3     | Photos: Wikimedia Commons and Openverse scripts with licence and credit                                                                                                   | Every photo passes the credit schema                                                                            |
| M6  | 8     | Bangkok map: MapLibre dynamic import, OpenFreeMap neutral style, numbered pins, mobile Map/List button, CARTO fallback                                                    | MapLibre absent from landing and place bundles; pin ↔ list highlight in e2e; works on a mid-range Android on 4G |
| M7  | 2     | Ship: e2e and Lighthouse jobs, production deploy                                                                                                                          | Budgets pass on landing, Bangkok and one place page                                                             |

Content track before the trip (~10–15 hours): Bangkok top-10 rewrite with verified prices and notes; scam alerts;
sourced cost tiers for Bangkok and Andaman; season calendar; a Reels shot list for the trip.

### Post-trip (~64 hours, in order)

1. Four more cities, photos, stale-price report (10)
2. Sidebar topics and URL filter state (8)
3. Maps for all cities (4)
4. Currency switcher (5)
5. Guides hub, vendors, mall must-dos (8, plus writing)
6. AI foundation: env, Turnstile, Upstash, kill switch (6)
7. Describe your trip (6)
8. Precomputed blurbs (3)
9. v2: Ask Hello Thailand (10)

## Verification

- Vitest: estimate tiers and warnings; ranking order and facet relaxing; price conversion; freshness at 89, 90, 180
  and 181 days; schema rejections; real content parses; privacy lint; Notes fixture.
- Playwright: chips ↔ map sync and live estimate; want-to-go persistence; pin ↔ list highlight; filter URL
  round-trip; AI kill-switch fallback.
- Build: static place pages; JS, font and image budgets; Lighthouse CI; CI greps `.next/static` for `sk-ant-` and
  secret names.
- Manual: mid-range Android on throttled 4G.
- Every milestone ends with real output from `pnpm check && pnpm build`.

## Risks

1. Private data reaching public git history → column allowlist, CSV path from env, privacy lint in hook and CI.
2. Pre-trip scope creep → strict order; the map (M6) is last, so it slips first.
3. Haiku 4.5 retirement "not sooner than 15 Oct 2026" → one `MODEL_ID`, a 10-prompt check before any swap,
   re-check status at the AI foundation milestone.
4. AI cost and abuse → Turnstile, daily quota, $5 cap, kill switch tested in e2e, `max_tokens` caps.
5. Free services changing → CARTO fallback for tiles, build-time geocoding only, FX snapshot fallback, batched
   Unsplash calls.

## Later roadmap (not v1)

- Pattaya and more regions.
- Stays top 10 by group, family and solo.
- ₹ trip-cost calculator.
- Itinerary planner fed by want-to-go.
- Paid plan review (₹299–499) with login.
- Google Maps export for paid users: Follow links to maintained shared lists, plus per-place save links (Google
  has no Saved-lists API).
- Community recommendations with upvotes, credits and incentives.
- Public chat for solo travellers.

Community and chat need accounts, moderation with report and block, DPDP Act consent, India IT Rules 2021
intermediary duties, meet-up safety rules, and a tax review for credits. Before any monetisation: move to
Cloudflare Workers, add ASCI "#Ad" disclosure, and join Travelpayouts or Cuelinks.
