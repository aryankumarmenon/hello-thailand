# Glossary

One term, one meaning. Code, content and docs use these words.

| Term                         | Meaning                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Region                       | One of six parts of Thailand on the landing map: Bangkok, Central, North, Isaan, Gulf, Andaman. A region is _active_ when the site has data for it.                                  |
| City                         | A destination with its own page, inside a region. Example: Bangkok, Phuket, Krabi Town.                                                                                              |
| Place                        | One thing a traveller can visit, eat at or do, with a stable `id`.                                                                                                                   |
| Topic / subtopic             | The two-level sidebar grouping on a city page. Example: Things to do → Temples.                                                                                                      |
| Neighbourhood                | An area inside a city that travellers use, such as `rattanakosin` or `silom`; not an official district. Stored as a slug, because the day planner filters and groups by exact match. |
| Price                        | A cost in Thai baht. Either _verified_ (`thb`, `label`, `checkedOn`, `source`) or _unverified_.                                                                                      |
| `checkedOn`                  | The date a verified price or fact was last confirmed against its source.                                                                                                             |
| Freshness                    | How old `checkedOn` is: _fresh_ under 90 days, _aging_ 90–180 days, _stale_ over 180 days, or _unverified_.                                                                          |
| Cost tier                    | A spending style: budget, mid or luxury.                                                                                                                                             |
| Estimate                     | A rough per-day cost range per cost tier for chosen regions and trip inputs. Not an itinerary.                                                                                       |
| Season warning               | A note on the estimate about conditions on the chosen dates, such as ferry cancellations.                                                                                            |
| Want-to-go                   | A place the visitor has marked, stored only in their browser.                                                                                                                        |
| Popularity                   | An editorial score from 1 to 5 for how worth visiting a place is.                                                                                                                    |
| Score                        | A place's value in a day plan: popularity × interest match.                                                                                                                          |
| Time needed                  | How long a visit to one place takes, in minutes. The time the day planner spends _at_ a stop, not between stops.                                                                     |
| Travel minutes               | The estimated time to go between two places; the cost the day planner adds between stops.                                                                                            |
| Opening hours                | When a place is open, as ranges per weekday, or a day written as closed. A day with no entry was never researched, which is not the same as closed.                                  |
| Geocode override             | A hand-set coordinate for a place OpenStreetMap places wrongly or not at all. Always wins over a looked-up pin, and may instead say the place stays unpinned.                        |
| OpenStreetMap credit         | The exact string `© OpenStreetMap contributors`, shown on any page that displays a coordinate. Required by ADR 0011. Use this wording, not a paraphrase.                             |
| Day plan                     | An ordered route of places for one day, in one or two neighbourhoods, built from scores, travel minutes and must-include places. Not a multi-day itinerary.                          |
| Must-include place           | A site place the visitor requires in a day plan. The planner builds the route around it, or lists it under "Does not fit today" with the reason.                                     |
| Source (of a recommendation) | `editorial` (written and checked by the site) or `community` (added by users, later).                                                                                                |
| Vendor                       | An activity operator on the hand-reviewed shortlist, with a licence or certification number.                                                                                         |
| Guide                        | A long-form topic page, such as travel money or scams, filterable by city.                                                                                                           |
| Privacy lint                 | The check that fails when private strings from the research data appear in the repo.                                                                                                 |
| `MODEL_ID`                   | The single constant naming the Claude model used by live AI features.                                                                                                                |
| Kill switch                  | The `AI_ENABLED` flag that turns live AI off and shows the non-AI fallback.                                                                                                          |
