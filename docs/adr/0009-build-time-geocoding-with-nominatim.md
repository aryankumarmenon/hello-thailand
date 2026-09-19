# 0009 — Build-time geocoding with Nominatim, cached and overridable

- Status: accepted
- Date: 2026-09-19

## Context

Places arrive from the research CSV with a street address and no coordinates. The city map (M6) and
the day planner's travel minutes (M8) both need a latitude and longitude for every place.

`docs/PLAN.md` scheduled this ADR alongside maps. M1 made the geocoding decisions, so they are
recorded here; the map library and tile source stay open until M6.

Running cost has to stay ₹0, which rules out a paid geocoder. The free option is Nominatim, the
OpenStreetMap Foundation's service, whose usage policy is strict: at most one request per second,
a single thread on a single machine, a User-Agent that identifies the application, and cached
results. Clients that repeat a query are classified as faulty and blocked.

## Decision

- Geocoding happens **once, at import time**, and the coordinates are committed. The site never
  geocodes at build or at runtime, so no page depends on a third-party service being up.
- **Nominatim** is the provider, called from `scripts/geocode.ts`, at one request per 1100 ms on a
  single thread with an identifying User-Agent.
- **Every answer is cached** in `content/geocode-cache.json`, misses included, and the cache is
  committed. The cache is a condition of using the service, not an optimisation: a re-run must send
  nothing.
- A place is looked up through an **ordered list of candidate queries** — the cleaned name, any
  alias in brackets, the address with abbreviations expanded, then the address as written — because
  the CSV address is often a restatement of the name and the two glued together match nothing.
- Two checks stand between an answer and a committed pin. A result outside the **Thailand bounding
  box** is refused by the `Coordinates` schema. A result that **shares no meaningful word** with the
  place name is refused as a different place.
- Every pin records **what it matched** (`geocode.query`, `geocode.matched`, `geocode.fetchedOn`) on
  the place itself, so a reviewer can judge the pin from the file.
- `content/overrides/geocode.json` holds hand-set coordinates with a note, and always wins —
  including over coordinates a place already has, since an override exists because an earlier run
  was wrong. An override may instead say `{"skip": true, "note": …}`, which leaves the place
  unpinned and stops a known-wrong answer being re-accepted.

## Consequences

- A place with no usable pin stays unpinned and is listed, rather than being pinned wrongly. Three
  Bangkok places are in that state today.
- The name check cannot catch a right name in the wrong place: OSM holds a second Moon Bar 12 km
  from the one we mean. That is what the recorded `matched` string is for, and reviewing pins stays
  a human job.
- The committed cache grows with the place list. At about 130 places it is small enough to read in
  a diff.
- **Settled in ADR 0011:** OpenStreetMap data is ODbL, which requires attribution and applies
  share-alike to a derived database, while ADR 0002 reserved all rights over everything in `content/`.
  ADR 0011 splits the licence by field — the coordinates and the `matched` names OpenStreetMap
  returned are ODbL and credited, while `geocode.query` and the cache keys stay reserved, because a
  query is our own name and address rather than an OSM answer — and requires the credit to be visible
  on any page that shows a coordinate.
- Rejected: a paid geocoder (cost); geocoding in the browser or at build time (a runtime dependency
  on a service whose policy forbids exactly that use).
