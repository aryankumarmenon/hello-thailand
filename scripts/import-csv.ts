/**
 * Import places from the private research CSV (ADR 0003).
 *
 * The CSV never enters this repo: its path comes from PLACES_CSV_PATH. Only Name,
 * Region, Category and Address are read. The Notes column carries personal trip
 * detail and is dropped by the parser itself, so no code downstream can reach it.
 *
 *   PLACES_CSV_PATH=/path/to/places.csv pnpm tsx scripts/import-csv.ts [--dry-run]
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";

import { CITY_SLUGS, Place, type CitySlug, type TopicSlug } from "../src/domain/schemas/place";
import { writeJson } from "./write-json";

/** The only columns the importer may see. Everything else is dropped at the parser. */
export const ALLOWED_COLUMNS = ["Name", "Region", "Category", "Address"] as const;

/** The CSV's Region column names a city, not a glossary Region (docs/CONTEXT.md). */
const CITY_BY_CSV_REGION: Record<string, CitySlug> = {
  Bangkok: "bangkok",
  Phuket: "phuket",
  "Krabi Town": "krabi-town",
  "Ao Nang Railay": "ao-nang-railay",
  "Ko Phi Phi": "ko-phi-phi",
};

/**
 * The CSV's own category words, mapped to site topics. This table describes the
 * private file's vocabulary, so it lives with the importer, not with the schema.
 */
const TOPIC_BY_CSV_CATEGORY: Record<string, TopicSlug> = {
  Eat: "eat",
  Drink: "drink",
  Sight: "sight",
  Temple: "temple",
  Shrine: "shrine",
  Museum: "museum",
  Market: "market",
  Nightlife: "nightlife",
  "Live music": "live-music",
  Beach: "beach",
  Nature: "nature",
  Park: "park",
  Viewpoint: "viewpoint",
  Cave: "cave",
  Hike: "hike",
  Walk: "walk",
  Climbing: "climbing",
  Diving: "diving",
  Snorkel: "snorkel",
  "Muay Thai": "muay-thai",
  Cooking: "cooking",
  Activity: "activity",
  "Day trip": "day-trip",
  Village: "village",
  Area: "area",
  Transit: "transit",
  Safety: "safety",
};

/** Stays are out of scope, so these rows never become places. */
const DROPPED_CATEGORIES = new Set(["Sleep"]);

export type AllowedRow = Partial<Record<(typeof ALLOWED_COLUMNS)[number], string>>;

/**
 * Parse the CSV, keeping only allowlisted columns.
 *
 * `bom: true` strips the UTF-8 byte order mark, which would otherwise make the first
 * header read as "﻿Name" and silently drop every Name.
 */
export function parseAllowedRows(csv: string): AllowedRow[] {
  return parse(csv, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    // Returning false for a column tells csv-parse to discard it: a dropped column
    // never becomes a key, so Notes cannot be read further down.
    columns: (header: string[]) =>
      header.map((name) => (ALLOWED_COLUMNS.includes(name as never) ? name : false)),
  }) as AllowedRow[];
}

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ImportResult = {
  places: Place[];
  /** Rows deliberately left out, with the reason. */
  skipped: { name: string; reason: string }[];
  /** Rows the importer could not map. These fail the run rather than pass silently. */
  problems: string[];
};

export function toPlaces(rows: AllowedRow[]): ImportResult {
  const places: Place[] = [];
  const skipped: ImportResult["skipped"] = [];
  const problems: string[] = [];
  const usedIds = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const line = index + 2; // header is line 1
    const name = row.Name?.trim();
    const region = row.Region?.trim();
    const category = row.Category?.trim();
    const address = row.Address?.trim();

    if (!name) {
      problems.push(`line ${line}: no Name`);
      continue;
    }
    if (category && DROPPED_CATEGORIES.has(category)) {
      skipped.push({ name, reason: `category ${category} is out of scope` });
      continue;
    }
    const city = region ? CITY_BY_CSV_REGION[region] : undefined;
    if (!city) {
      problems.push(`line ${line} (${name}): unknown Region ${JSON.stringify(region ?? "")}`);
      continue;
    }
    const topic = category ? TOPIC_BY_CSV_CATEGORY[category] : undefined;
    if (!topic) {
      problems.push(`line ${line} (${name}): unknown Category ${JSON.stringify(category ?? "")}`);
      continue;
    }
    if (!address) {
      problems.push(`line ${line} (${name}): no Address`);
      continue;
    }

    // Ids are URL segments and must stay stable, so a clash is numbered, not overwritten.
    const base = slugify(name) || "place";
    let id = base;
    for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
    usedIds.add(id);

    const parsed = Place.safeParse({
      id,
      name,
      city,
      topics: [topic],
      address,
      source: "editorial",
    });
    if (!parsed.success) {
      problems.push(
        `line ${line} (${name}): ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
      continue;
    }
    places.push(parsed.data);
  }

  return { places, skipped, problems };
}

/**
 * Merge an imported place over what is already committed.
 *
 * The importer owns the core fields and nothing else, so it must name them rather than
 * spread the whole imported place: every other field on a freshly imported place holds
 * a schema default, and spreading would overwrite a verified price with "unverified".
 *
 * Topics are merged, not replaced. The CSV gives one category; a person may have tagged
 * the place with more, and a re-import must not throw that away.
 */
export function mergeWithExisting(imported: Place, existing: Place | undefined): Place {
  if (!existing) return imported;
  const { id, name, city, address, source } = imported;
  const topics = [...new Set([...imported.topics, ...existing.topics])];
  return { ...existing, id, name, city, address, source, topics };
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "places");

async function readExisting(city: CitySlug, id: string): Promise<Place | undefined> {
  try {
    const raw = await readFile(path.join(CONTENT_ROOT, city, `${id}.json`), "utf8");
    const parsed = Place.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function writePlaces(places: Place[], root = CONTENT_ROOT): Promise<void> {
  for (const place of places) {
    await writeJson(path.join(root, place.city, `${place.id}.json`), place);
  }
}

async function main(): Promise<void> {
  const csvPath = process.env["PLACES_CSV_PATH"];
  if (!csvPath) {
    throw new Error(
      "PLACES_CSV_PATH is not set. Point it at the private research CSV; it is never copied into this repo (ADR 0003).",
    );
  }
  const dryRun = process.argv.includes("--dry-run");
  // The pre-trip slice ships Bangkok only (docs/PLAN.md); the other cities import later.
  const onlyCity = process.argv.find((arg) => arg.startsWith("--city="))?.split("=")[1];

  const rows = parseAllowedRows(await readFile(csvPath, "utf8"));
  const { places: allPlaces, skipped, problems } = toPlaces(rows);
  const places = onlyCity ? allPlaces.filter((place) => place.city === onlyCity) : allPlaces;

  if (onlyCity && places.length === 0) {
    throw new Error(`--city=${onlyCity} matched no places. Known cities: ${CITY_SLUGS.join(", ")}`);
  }

  if (problems.length > 0) {
    console.error(`${problems.length} row(s) could not be imported:`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }

  const merged = await Promise.all(
    places.map(async (place) => mergeWithExisting(place, await readExisting(place.city, place.id))),
  );

  const byCity = new Map<string, number>();
  for (const place of merged) byCity.set(place.city, (byCity.get(place.city) ?? 0) + 1);

  console.log(`${rows.length} rows read, ${merged.length} places, ${skipped.length} skipped`);
  for (const [city, count] of [...byCity].sort()) console.log(`  ${city}: ${count}`);
  for (const { name, reason } of skipped) console.log(`  skipped ${name}: ${reason}`);

  if (dryRun) {
    console.log("--dry-run: nothing written");
    return;
  }
  await writePlaces(merged);
  const written = await readdir(CONTENT_ROOT);
  console.log(`written to content/places/${written.length === 1 ? written[0] : ""}`);
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
