/**
 * Add coordinates to committed places, using Nominatim (OpenStreetMap).
 *
 * The OSMF usage policy (https://operations.osmfoundation.org/policies/nominatim/) allows
 * a one-time bulk task under strict terms, and this script holds to all of them:
 * at most one request per second, a single thread, an identifying User-Agent, and every
 * result cached so a re-run sends no requests at all. Repeating the same query is what
 * gets an application blocked.
 *
 *   pnpm tsx scripts/geocode.ts [--city=bangkok] [--dry-run]
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { z } from "zod";

import { Coordinates, Place } from "../src/domain/schemas/place";
import { writeJson } from "./write-json";

const USER_AGENT = "hello-thailand/0.1 (+https://hello-thailand-planner.vercel.app)";
const ONE_REQUEST_EVERY_MS = 1_100;

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PLACES_ROOT = path.join(CONTENT_ROOT, "places");
const CACHE_PATH = path.join(CONTENT_ROOT, "geocode-cache.json");
const OVERRIDES_PATH = path.join(CONTENT_ROOT, "overrides", "geocode.json");

/** One cached answer. `found: false` is cached too, so a hopeless query is asked once. */
export type CacheEntry =
  | { found: true; lat: number; lng: number; matched: string; fetchedOn: string }
  | { found: false; fetchedOn: string };

export type GeocodeCache = Record<string, CacheEntry>;
/**
 * Hand-set coordinates, keyed by place id, for the places Nominatim cannot find or gets
 * wrong. An override always wins, and `note` records where the number came from.
 */
export const GeocodeOverrides = z.record(
  z.string(),
  z.strictObject({ lat: z.number(), lng: z.number(), note: z.string().min(1) }),
);
export type GeocodeOverrides = z.infer<typeof GeocodeOverrides>;

/**
 * Drop the noise that stops a place name from matching: a parenthetical alias, a second
 * venue after "&" or "/", and a trailing description such as "food crawl".
 */
function cleanName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+[&/]\s+/)[0]!
    .replace(/\s+(food crawl|crawl|street)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The research CSV uses the guidebook's "Th" for Thanon, Thai for road. OSM spells it out. */
function expandAbbreviations(address: string): string {
  return address.replace(/\bTh\.?\s+/g, "Thanon ");
}

const CITY_NAMES: Record<string, string> = {
  bangkok: "Bangkok",
  phuket: "Phuket",
  "krabi-town": "Krabi",
  "ao-nang-railay": "Ao Nang",
  "ko-phi-phi": "Ko Phi Phi",
};

/**
 * Queries to try for one place, most likely first.
 *
 * A single query does badly here: the CSV address is often a restatement of the name
 * ("Golden Mount (Wat Saket)" at "Wat Saket Golden Mount"), and gluing the two together
 * makes a string that matches nothing. So the cleaned name is tried first, then the
 * alias in brackets, then the address with its abbreviations spelled out.
 */
export function buildQueries(place: Pick<Place, "name" | "address" | "city">): string[] {
  const city = CITY_NAMES[place.city] ?? place.city;
  const suffix = `, ${city}, Thailand`;
  const alias = /\(([^)]+)\)/.exec(place.name)?.[1];

  const candidates = [
    cleanName(place.name) + suffix,
    alias ? cleanName(alias) + suffix : undefined,
    expandAbbreviations(place.address.trim()),
  ].filter((query): query is string => typeof query === "string" && query.length > suffix.length);

  return [...new Set(candidates)];
}

/** Nominatim returns lat/lon as strings, and calls longitude `lon`. */
export function pickResult(
  payload: unknown,
): { lat: number; lng: number; matched: string } | undefined {
  if (!Array.isArray(payload)) return undefined;
  const first: unknown = payload[0];
  if (typeof first !== "object" || first === null) return undefined;
  const record = first as Record<string, unknown>;
  const lat = Number(record["lat"]);
  const lng = Number(record["lon"]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  const matched = typeof record["display_name"] === "string" ? record["display_name"] : "";
  return { lat, lng, matched };
}

export function nominatimUrl(query: string): string {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "th");
  url.searchParams.set("accept-language", "en");
  return url.toString();
}

export type Lookup = (query: string) => Promise<unknown>;

export const liveLookup: Lookup = async (query) => {
  const response = await fetch(nominatimUrl(query), { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Nominatim answered ${response.status} for ${query}`);
  return response.json();
};

export type GeocodeReport = {
  located: { id: string; from: "override" | "cache" | "nominatim" }[];
  problems: string[];
};

/**
 * Resolve coordinates for every place that has none.
 *
 * Order is override, then cache, then the network, so a hand-fixed place is never asked
 * about again and a re-run costs nothing. A result outside Thailand is refused by the
 * Coordinates schema and reported rather than written.
 */
export async function geocodePlaces(
  places: Place[],
  options: {
    cache: GeocodeCache;
    overrides: GeocodeOverrides;
    lookup: Lookup;
    today: string;
    onRequest?: () => Promise<void>;
  },
): Promise<{ places: Place[]; report: GeocodeReport }> {
  const { cache, overrides, lookup, today } = options;
  const report: GeocodeReport = { located: [], problems: [] };
  const out: Place[] = [];

  for (const place of places) {
    if (place.coordinates) {
      out.push(place);
      continue;
    }

    const override = overrides[place.id];
    if (override) {
      const checked = Coordinates.safeParse({ lat: override.lat, lng: override.lng });
      if (checked.success) {
        out.push({ ...place, coordinates: checked.data });
        report.located.push({ id: place.id, from: "override" });
      } else {
        report.problems.push(`${place.id}: override is outside Thailand`);
        out.push(place);
      }
      continue;
    }

    const queries = buildQueries(place);
    let entry: CacheEntry | undefined;
    let from: "cache" | "nominatim" = "cache";
    let failed = false;

    for (const query of queries) {
      const cached = cache[query];
      if (cached) {
        if (cached.found) {
          entry = cached;
          from = "cache";
          break;
        }
        continue; // a cached miss: try the next candidate, never the network again
      }

      await options.onRequest?.();
      try {
        const found = pickResult(await lookup(query));
        const fresh: CacheEntry = found
          ? { found: true, ...found, fetchedOn: today }
          : { found: false, fetchedOn: today };
        cache[query] = fresh;
        if (fresh.found) {
          entry = fresh;
          from = "nominatim";
          break;
        }
      } catch (error) {
        report.problems.push(
          `${place.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        failed = true;
        break;
      }
    }

    if (failed) {
      out.push(place);
      continue;
    }

    if (!entry?.found) {
      report.problems.push(
        `${place.id}: no result for ${queries.map((q) => JSON.stringify(q)).join(" or ")}`,
      );
      out.push(place);
      continue;
    }

    const checked = Coordinates.safeParse({ lat: entry.lat, lng: entry.lng });
    if (!checked.success) {
      report.problems.push(
        `${place.id}: ${entry.lat}, ${entry.lng} is outside Thailand (matched ${JSON.stringify(entry.matched)})`,
      );
      out.push(place);
      continue;
    }

    out.push({ ...place, coordinates: checked.data });
    report.located.push({ id: place.id, from });
  }

  return { places: out, report };
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function readPlaces(onlyCity: string | undefined): Promise<{ file: string; place: Place }[]> {
  const cities = (await readdir(PLACES_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && (!onlyCity || entry.name === onlyCity))
    .map((entry) => entry.name);

  const out: { file: string; place: Place }[] = [];
  for (const city of cities) {
    const dir = path.join(PLACES_ROOT, city);
    for (const name of (await readdir(dir)).filter((n) => n.endsWith(".json"))) {
      const file = path.join(dir, name);
      out.push({ file, place: Place.parse(JSON.parse(await readFile(file, "utf8"))) });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const onlyCity = process.argv.find((arg) => arg.startsWith("--city="))?.split("=")[1];
  const today = new Date().toISOString().slice(0, 10);

  const entries = await readPlaces(onlyCity);
  const cache = await readJson<GeocodeCache>(CACHE_PATH, {});
  const overrides = GeocodeOverrides.parse(await readJson<unknown>(OVERRIDES_PATH, {}));
  const missing = entries.filter(({ place }) => !place.coordinates).length;
  console.log(`${entries.length} places, ${missing} without coordinates`);

  let requests = 0;
  const { places, report } = await geocodePlaces(
    entries.map(({ place }) => place),
    {
      cache,
      overrides,
      lookup: liveLookup,
      today,
      // The policy's hard limit: one request per second, one thread, nothing parallel.
      onRequest: async () => {
        if (requests > 0) await sleep(ONE_REQUEST_EVERY_MS);
        requests += 1;
      },
    },
  );

  const fromNetwork = report.located.filter((l) => l.from === "nominatim").length;
  console.log(
    `located ${report.located.length} (${fromNetwork} from Nominatim, ${report.located.length - fromNetwork} from cache or overrides)`,
  );
  for (const problem of report.problems) console.log(`  ${problem}`);

  // A place OSM cannot find needs a person to read the coordinates off a map, so print
  // the exact lines to paste into content/overrides/geocode.json.
  const unresolved = places.filter((place) => !place.coordinates);
  if (unresolved.length > 0) {
    console.log(
      `\n${unresolved.length} place(s) need an override in content/overrides/geocode.json:`,
    );
    const stub = Object.fromEntries(
      unresolved.map((place) => [
        place.id,
        { lat: 0, lng: 0, note: `set from a map: ${place.name}` },
      ]),
    );
    console.log(JSON.stringify(stub, null, 2));
  }

  if (dryRun) {
    console.log("--dry-run: nothing written");
    return;
  }

  // The cache is written even when a place failed, so a repeated run cannot re-ask.
  await writeJson(CACHE_PATH, sortKeys(cache));

  for (const [index, place] of places.entries()) {
    const entry = entries[index];
    if (!entry || !place.coordinates || entry.place.coordinates) continue;
    await writeJson(entry.file, place);
  }
  console.log(`cache: ${Object.keys(cache).length} queries`);
  if (report.problems.length > 0) process.exitCode = 1;
}

function sortKeys(cache: GeocodeCache): GeocodeCache {
  return Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
