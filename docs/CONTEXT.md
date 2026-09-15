# Glossary

One term, one meaning. Code, content and docs use these words.

| Term                         | Meaning                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Region                       | One of six parts of Thailand on the landing map: Bangkok, Central, North, Isaan, Gulf, Andaman. A region is _active_ when the site has data for it. |
| City                         | A destination with its own page, inside a region. Example: Bangkok, Phuket, Krabi Town.                                                             |
| Place                        | One thing a traveller can visit, eat at or do, with a stable `id`.                                                                                  |
| Topic / subtopic             | The two-level sidebar grouping on a city page. Example: Things to do → Temples.                                                                     |
| Neighbourhood                | An area inside a city, used as an extra filter.                                                                                                     |
| Price                        | A cost in Thai baht. Either _verified_ (`thb`, `label`, `checkedOn`, `source`) or _unverified_.                                                     |
| `checkedOn`                  | The date a verified price or fact was last confirmed against its source.                                                                            |
| Freshness                    | How old `checkedOn` is: _fresh_ under 90 days, _aging_ 90–180 days, _stale_ over 180 days, or _unverified_.                                         |
| Cost tier                    | A spending style: budget, mid or luxury.                                                                                                            |
| Estimate                     | A rough per-day cost range per cost tier for chosen regions and trip inputs. Not an itinerary.                                                      |
| Season warning               | A note on the estimate about conditions on the chosen dates, such as ferry cancellations.                                                           |
| Want-to-go                   | A place the visitor has marked, stored only in their browser.                                                                                       |
| Source (of a recommendation) | `editorial` (written and checked by the site) or `community` (added by users, later).                                                               |
| Vendor                       | An activity operator on the hand-reviewed shortlist, with a licence or certification number.                                                        |
| Guide                        | A long-form topic page, such as travel money or scams, filterable by city.                                                                          |
| Privacy lint                 | The check that fails when private strings from the research data appear in the repo.                                                                |
| `MODEL_ID`                   | The single constant naming the Claude model used by live AI features.                                                                               |
| Kill switch                  | The `AI_ENABLED` flag that turns live AI off and shows the non-AI fallback.                                                                         |
