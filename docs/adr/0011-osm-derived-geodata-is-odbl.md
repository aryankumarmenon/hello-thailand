# 0011 — OpenStreetMap-derived geodata is ODbL, the rest of `content/` is not

- Status: accepted
- Date: 2026-09-19

## Context

ADR 0002 licences everything in `content/` as all rights reserved. ADR 0009 then made every coordinate
on the site OpenStreetMap-derived and committed `content/geocode-cache.json`, which reproduces OSM
`display_name` strings, and left the licence question open.

The two cannot both stand. OpenStreetMap data is published under the Open Database License 1.0, which
asks two different things of two different kinds of output:

- A **Derivative Database** — a database built from OSM data — must be published under ODbL and must
  credit OpenStreetMap. This is the share-alike term.
- A **Produced Work** — something rendered _from_ a database, such as a map image or a web page — needs
  only the credit. It does not have to be ODbL.

`content/geocode-cache.json` is a Derivative Database: 65 cached query results, of which 35 hold an OSM
coordinate and the `display_name` string it came from, while 30 record that the query found nothing. The
`coordinates` and `geocode` fields on each place file are the same data, copied into a record that is
otherwise ours, and `content/overrides/geocode.json` holds six more coordinates entered by hand. The
rendered place page will be a Produced Work.

Whether the 37 coordinates we hold is a "Substantial" extract at all is arguable, and ODbL allows
insubstantial ones freely. That argument is not worth having. The place list grows toward ~130, the
cache grows with it, and coordinates are not what makes this site worth reading.

## Decision

The licence is split by **field**, not by directory.

- **ODbL 1.0, credited to OpenStreetMap contributors:** `content/geocode-cache.json` in full; the
  `coordinates` and `geocode` fields of every place file; and in `content/overrides/geocode.json`, the
  `lat` and `lng` of every entry together with the OpenStreetMap place names quoted in its notes. The
  override file is easy to miss because it is hand-edited, but a hand-copied coordinate is still an
  extract.
- **All rights reserved, as ADR 0002 says:** everything else in `content/` — names, topics, guide text,
  traveller notes, prices and their sources, cost ranges, and the editorial planner fields.

`content/` is therefore a Collective Database: an ODbL part sitting beside an independent part that
ODbL does not reach. `content/LICENSE` says which is which.

Credit reads "© OpenStreetMap contributors" and links to the ODbL. It goes in `content/LICENSE` now,
and it MUST also be visible to a reader on any page that shows a coordinate: the place page in M4 and
the city map in M6. A page that plots an OSM-derived pin without that line is not compliant.

## Consequences

- Anyone may reuse the coordinates under ODbL, which costs nothing. The researched content, which is
  the actual work, stays closed.
- Two obligations now ride on later milestones, and both are recorded in `docs/STATUS.md`:
  M4 renders the credit on the place page, M6 renders it on the map. The tile source M6 chooses will
  carry its own attribution, which stacks with this one rather than replacing it.
- A field-level split has to be kept true as the schema grows. Any new field copied from OSM belongs on
  the ODbL side of `content/LICENSE`, and adding one without saying so is the way this quietly breaks.
- Rejected: **relicensing all of `content/` as ODbL** — share-alike would reach the researched text,
  which is the one thing that must not be copyable. Rejected: **deleting the cache from the repo** —
  ADR 0009 makes committing it a condition of using Nominatim at all, since a re-run must send nothing.
  Rejected: **arguing the extract is insubstantial** — it is a live argument today and a losing one at
  130 places, and attribution costs a line.
