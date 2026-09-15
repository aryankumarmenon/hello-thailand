# Research

Findings behind `PLAN.md` and `DECISIONS.md`, gathered 15 Sep 2026. Facts about services and prices change:
re-check the source before relying on a number, and update the date here when you do.

## Market

- Indian arrivals to Thailand: 2.1M (2024), 2.49M (2025), target 2.55M (2026).
  [Skift](https://skift.com/2025/01/08/india-now-thailands-third-largest-tourist-market-with-record-arrivals-india-report/)
- Visa-free entry for Indians is 30 days from 15 Sep 2026; the rules changed several times in 2026. A TDAC
  arrival card is required. [Thai Examiner](https://www.thaiexaminer.com/thai-news-foreigners/2026/09/04/blunder-over-indian-visa-policy-saw-thailand-lose-tourists-in-august-quick-volte-face-to-a-30-day-visa/)
- Fake paid TDAC sites exist; TAT issued a warning. [Malay Mail](https://www.malaymail.com/amp/news/world/2025/05/01/thailand-warns-travellers-of-fake-digital-arrival-card-website-charging-us10-for-free-entry-form/175225)
- Traveller pains (proxy sources; Reddit was not crawlable): visa rule changes, Pattaya jet-ski extortion, taxi,
  tuk-tuk and gem scams, dynamic currency conversion, veg and Jain food, heat illness, budget uncertainty.

## Competitors

| Product                                      | What it does                                       | Money                         | Weakness                        |
| -------------------------------------------- | -------------------------------------------------- | ----------------------------- | ------------------------------- |
| Wanderlog                                    | Map + drag-drop day planner, collaboration         | Pro ~$40–50/yr                | Export behind paywall; stale AI |
| Mindtrip                                     | AI chat planner                                    | VC-funded, free               | Booking incomplete              |
| Layla                                        | AI planner                                         | Acquired by Expedia, Jul 2026 | No longer independent           |
| Stippl                                       | Packing, expenses, reels                           | €24.99/yr                     | Sync bugs                       |
| TAGTHAi                                      | Thailand's official travel super app               | Bookings                      | Commerce-first                  |
| Travelfish                                   | Deep, dated SE Asia guides                         | $35/yr membership             | Dated design, thin on logistics |
| AraiWa, ThaiTravelTools                      | Thailand signal feed; weather and island-risk tool | Ad-free; affiliates           | No map planner                  |
| Pickyourtrail, Thrillophilia, TravelTriangle | Indian package sellers                             | Commission                    | Not independent research        |

Gap: independent, dated, verified, Indian-specific, tools-first.

## UX references

- Landing: Kayak Explore (budget slider recolours the map live). Government tourism sites (TAT, japan.travel,
  visitportugal) have no map with a cost tool. Clickable country maps are inline SVG with one path per region.
- Estimate: Budget Your Trip and ThaiTravelTools show per-day ranges by tier, never one number.
- City page: TripAdvisor numbered pins ↔ list; Mintlify docs sidebar (top groups expanded, two levels); Algolia
  applied-filter chips with Clear all; Airbnb selections in URL parameters.
- Guides: Time Out Bangkok (browse by area and by theme); The Infatuation (city-filtered guides — avoid silent empty
  states); listicles with a photo per item (7-Eleven guides, Klook ICONSIAM guide).
- Bento: Linear and Vercel marketing sections — one anchor card, a few supporting cards.
- Contrast: red `#A51931` on beige `#F5EFE4` 6.6:1; navy `#2D2A4A` on beige 11.9:1; red on dark `#1E1C33` 2.2:1 (fails).

## Services, terms and limits

| Area                | Finding                                                                                                                                                                           | Source                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby        | Non-commercial only; affiliate links and ads count as commercial. Pro $20/seat/month. 5,000 image transformations                                                                 | [Fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby](https://vercel.com/docs/plans/hobby)                  |
| Cloudflare          | OpenNext targets Workers (not Pages); free plan Worker limit 3 MiB gzipped                                                                                                        | [OpenNext](https://opennext.js.org/cloudflare)                                                                                |
| Map tiles           | OpenFreeMap: free, no key, commercial OK, no SLA. CARTO: key, fallback. MapTiler and Stadia free plans are non-commercial                                                         | [OpenFreeMap](https://openfreemap.org), [CARTO](https://docs.carto.com/faqs/carto-basemaps)                                   |
| Geocoding           | Nominatim: ≤ 1 request/s, cache results, no client-side autocomplete. Google geocoding allows 30-day storage only                                                                 | [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)                                                  |
| Photos              | Wikimedia Commons: attribution per licence (111 ICONSIAM, 211 Railay files). Unsplash: hotlink, credit, download ping, demo 50 requests/h. Google Places photos: paid, no caching | [Commons licensing](https://commons.wikimedia.org/wiki/Commons:Licensing), [Unsplash API](https://unsplash.com/documentation) |
| FX                  | Frankfurter: free, no key, ECB rates incl. THB and INR. fawazahmed0 currency API: free CDN JSON. exchangerate.host now needs a key                                                | [Frankfurter](https://frankfurter.dev/), [currency-api](https://github.com/fawazahmed0/exchange-api)                          |
| Rate limit store    | Upstash Redis free: 500K commands/month, 256 MB. Vercel WAF on Hobby: 1 rule, 10-minute window                                                                                    | [Upstash](https://upstash.com/pricing/redis), [Vercel WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)  |
| Bot check           | Cloudflare Turnstile: free; tokens single-use, expire after 300 s                                                                                                                 | [Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)                                  |
| Claude pricing      | Per 1M tokens in/out: Haiku 4.5 $1/$5, Sonnet 5 $2/$10, Opus 5 $5/$25. Batch API 50% off                                                                                          | Anthropic pricing                                                                                                             |
| Haiku 4.5 lifecycle | Active; retirement "not sooner than October 15, 2026"; at least 60 days' notice                                                                                                   | [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)                                     |
| Prompt caching      | Haiku minimum cacheable prompt 1,024 tokens; cache lives 5 minutes                                                                                                                | [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)                                        |
| Tooling             | Next.js 16 removed `next lint`. Velite's last release is old; Content Collections is maintained. Vercel lists pnpm 6–10                                                           | [Next 16 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-16)                                                    |

Rough live AI cost: describe-trip parse ≈ $0.001 per use on Haiku; grounded answer with cached dataset ≈ $0.004.

## Content gaps in the source research

- No generic budget/mid/luxury cost data per region.
- No mall must-dos.
- Dive and snorkel operators listed without licence, certification or review checks.
- Strong: nightlife, scams, history, travel money.

## Legal notes

- Copying photos or text without a licence is infringement under India's Copyright Act, pet project or not.
- ASCI requires "#Ad" as the first visible element of each affiliate link (only relevant after monetisation).
- DPDP Act 2023 has no small-site exemption; substantive duties apply from May 2027. Do not log IP with questions.
- User-posted content brings India IT Rules 2021 intermediary duties (grievance officer).

## Monetisation notes (after the trip, only if needed)

- Affiliates open to new sites: Travelpayouts (Agoda, Booking, Hostelworld, 12Go), Cuelinks (India, ₹500 minimum
  payout), Klook via Involve Asia, GetYourGuide. Amazon.in Associates closes accounts without 3 sales in 180 days.
- Static PDF itineraries sell cheaply (₹5–79 after discounts on Topmate); a personal plan review sells better
  (₹489 call, ₹1,199 review). No GST registration below ₹20 lakh/year.
- Revenue guess: 1k visits/month ≈ ₹0–1.5k; 10k ≈ ₹3–8k; 50k ≈ ₹30–70k.
