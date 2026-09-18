import { describe, expect, it, vi, type Mock } from "vitest";

import {
  buildQueries,
  geocodePlaces,
  looksLikeTheSamePlace,
  nominatimUrl,
  pickResult,
  type GeocodeCache,
  type GeocodeOverrides,
  type Lookup,
} from "../../scripts/geocode";
import type { Place } from "../../src/domain/schemas/place";

const place = (over: Partial<Place> = {}): Place => ({
  id: "wat-pho",
  name: "Wat Pho",
  city: "bangkok",
  topics: ["temple"],
  address: "2 Sanam Chai Road, Bangkok",
  source: "editorial",
  price: { status: "unverified" },
  ...over,
});

/** The shape Nominatim actually returns: lat/lon as strings, longitude called "lon". */
const nominatimAnswer = [
  { lat: "13.7463456", lon: "100.4927381", display_name: "Wat Pho, Bangkok, Thailand" },
];

const today = "2026-09-18";

describe("buildQueries", () => {
  const queries = (name: string, address: string, city: Place["city"] = "bangkok") =>
    buildQueries({ name, address, city });

  it("tries the place name against its city first", () => {
    expect(queries("Wat Pho", "2 Sanam Chai Road, Bangkok")[0]).toBe("Wat Pho, Bangkok, Thailand");
  });

  it("tries the alias in brackets as its own query", () => {
    // The bracketed name is often the one OSM knows.
    expect(queries("Golden Mount (Wat Saket)", "Wat Saket Golden Mount, Bangkok")).toContain(
      "Wat Saket, Bangkok, Thailand",
    );
  });

  it("keeps only the first venue when a row lists several", () => {
    expect(queries("RCA (Route 66 / Onyx)", "RCA Royal City Avenue, Bangkok")[0]).toBe(
      "RCA, Bangkok, Thailand",
    );
    expect(queries("Wat Phra Kaew & Grand Palace", "Wat Phra Kaew, Bangkok")[0]).toBe(
      "Wat Phra Kaew, Bangkok, Thailand",
    );
  });

  it("drops a trailing description that is not part of the name", () => {
    expect(queries("Yaowarat (Chinatown) food crawl", "Yaowarat Road, Bangkok")[0]).toBe(
      "Yaowarat, Bangkok, Thailand",
    );
  });

  it("spells out the guidebook's Th for Thanon", () => {
    expect(queries("Thip Samai Pad Thai", "Th Mahachai, Bangkok")).toContain(
      "Thanon Mahachai, Bangkok",
    );
  });

  it("uses the city's own name, not its slug", () => {
    expect(queries("Railay Beach", "Railay, Krabi", "ao-nang-railay")[0]).toBe(
      "Railay Beach, Ao Nang, Thailand",
    );
  });

  it("never repeats the same query", () => {
    const list = queries("Wat Pho", "Wat Pho, Bangkok, Thailand");
    expect(new Set(list).size).toBe(list.length);
  });
});

describe("nominatimUrl", () => {
  it("restricts to Thailand and asks for English names", () => {
    const url = new URL(nominatimUrl("Wat Pho, Bangkok"));
    expect(url.searchParams.get("countrycodes")).toBe("th");
    expect(url.searchParams.get("accept-language")).toBe("en");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(url.searchParams.get("q")).toBe("Wat Pho, Bangkok");
  });
});

describe("pickResult", () => {
  it("reads lon as lng and turns the strings into numbers", () => {
    expect(pickResult(nominatimAnswer)).toEqual({
      lat: 13.7463456,
      lng: 100.4927381,
      matched: "Wat Pho, Bangkok, Thailand",
    });
  });

  it("returns nothing for an empty answer", () => {
    expect(pickResult([])).toBeUndefined();
    expect(pickResult({})).toBeUndefined();
    expect(pickResult(null)).toBeUndefined();
  });

  it("returns nothing when the coordinates are not numbers", () => {
    expect(pickResult([{ lat: "not-a-number", lon: "100.49" }])).toBeUndefined();
  });
});

describe("looksLikeTheSamePlace", () => {
  it("accepts a match that shares the distinctive word", () => {
    expect(looksLikeTheSamePlace("Wat Pho", "Wat Pho, Maha Rat Road, Bangkok")).toBe(true);
  });

  // The real miss: asked for a rooftop bar, OSM returned a concert hall 9 km away.
  it("rejects a match that is a different thing entirely", () => {
    expect(
      looksLikeTheSamePlace("Roof at Sala Rattanakosin", "Thailand Cultural Centre, Huai Khwang"),
    ).toBe(false);
  });

  it("ignores words too common to prove anything", () => {
    expect(looksLikeTheSamePlace("Some Bar", "Another Bar, Bangkok, Thailand")).toBe(false);
  });

  it("is honest about what it cannot catch", () => {
    // Same name, wrong side of the city. Only the recorded `matched` string shows this.
    expect(looksLikeTheSamePlace("Moon Bar (Banyan Tree)", "Moon Bar - Rooftop, Chatuchak")).toBe(
      true,
    );
  });
});

describe("geocodePlaces", () => {
  const run = async (
    places: Place[],
    over: {
      cache?: GeocodeCache;
      overrides?: GeocodeOverrides;
      lookup?: Mock<Lookup>;
    } = {},
  ) => {
    const lookup: Mock<Lookup> = over.lookup ?? vi.fn<Lookup>(async () => nominatimAnswer);
    const result = await geocodePlaces(places, {
      cache: over.cache ?? {},
      overrides: over.overrides ?? {},
      lookup,
      today,
    });
    return { ...result, lookup };
  };

  it("asks Nominatim for a place with no coordinates", async () => {
    const { places, report, lookup } = await run([place()]);
    expect(places[0]?.coordinates).toEqual({ lat: 13.7463456, lng: 100.4927381 });
    expect(places[0]?.geocode?.matched).toBe("Wat Pho, Bangkok, Thailand");
    expect(places[0]?.geocode?.query).toBe("Wat Pho, Bangkok, Thailand");
    expect(report.located).toEqual([{ id: "wat-pho", from: "nominatim" }]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("never asks about a place that already has coordinates", async () => {
    const located = place({ coordinates: { lat: 13.7, lng: 100.5 } });
    const { lookup, report } = await run([located]);
    expect(lookup).not.toHaveBeenCalled();
    expect(report.located).toEqual([]);
  });

  // The OSM policy blocks clients that repeat the same query.
  it("uses the cache instead of repeating a query", async () => {
    const cache: GeocodeCache = {
      "Wat Pho, Bangkok, Thailand": {
        found: true,
        lat: 13.7463456,
        lng: 100.4927381,
        matched: "Wat Pho",
        query: "Wat Pho, Bangkok, Thailand",
        fetchedOn: "2026-09-01",
      },
    };
    const { places, report, lookup } = await run([place()], { cache });
    expect(lookup).not.toHaveBeenCalled();
    expect(report.located).toEqual([{ id: "wat-pho", from: "cache" }]);
    expect(places[0]?.coordinates?.lat).toBe(13.7463456);
  });

  it("caches a miss, so a re-run sends no requests at all", async () => {
    const cache: GeocodeCache = {};
    const lookup = vi.fn<Lookup>(async () => []);

    const { report } = await run([place()], { cache, lookup });
    expect(report.problems[0]).toContain("no result");
    expect(cache["Wat Pho, Bangkok, Thailand"]).toEqual({ found: false, fetchedOn: today });
    // Every candidate query was tried, and every one of them was cached as a miss.
    const firstRunCalls = lookup.mock.calls.length;
    expect(Object.keys(cache)).toHaveLength(firstRunCalls);

    // The OSM policy blocks clients that repeat a query: a second run must be silent.
    await run([place()], { cache, lookup });
    expect(lookup).toHaveBeenCalledTimes(firstRunCalls);
  });

  it("prefers a hand-set override over the network", async () => {
    const overrides: GeocodeOverrides = {
      "wat-pho": { lat: 13.7465, lng: 100.4927, note: "Nominatim matched the wrong gate" },
    };
    const { places, report, lookup } = await run([place()], { overrides });
    expect(lookup).not.toHaveBeenCalled();
    expect(places[0]?.coordinates).toEqual({ lat: 13.7465, lng: 100.4927 });
    expect(report.located).toEqual([{ id: "wat-pho", from: "override" }]);
  });

  // The failure the research repo hit: a lookup silently answering with another country.
  it("refuses a result outside Thailand and reports it", async () => {
    const lookup = vi.fn<Lookup>(async () => [
      { lat: "46.3625", lon: "14.0936", display_name: "Lake Bled, Slovenia" },
    ]);
    const { places, report } = await run([place()], { lookup });
    expect(places[0]?.coordinates).toBeUndefined();
    expect(report.located).toEqual([]);
    expect(report.problems[0]).toContain("outside Thailand");
    expect(report.problems[0]).toContain("Lake Bled");
  });

  it("refuses a match that shares no word with the place name", async () => {
    const lookup = vi.fn<Lookup>(async () => [
      { lat: "13.7667", lon: "100.5694", display_name: "Thailand Cultural Centre, Huai Khwang" },
    ]);
    const { places, report } = await run([place({ name: "Roof at Sala Rattanakosin" })], {
      lookup,
    });
    expect(places[0]?.coordinates).toBeUndefined();
    expect(report.problems[0]).toContain("shares no word");
  });

  it("reports a network failure and leaves the place alone", async () => {
    const lookup = vi.fn<Lookup>(async () => {
      throw new Error("Nominatim answered 429");
    });
    const { places, report } = await run([place()], { lookup });
    expect(places[0]?.coordinates).toBeUndefined();
    expect(report.problems[0]).toContain("429");
  });

  it("keeps one place's failure from stopping the rest", async () => {
    // Answer by query, not by call order: one place now tries several candidates.
    const lookup = vi.fn<Lookup>(async (query) =>
      query.startsWith("Wat Arun") ? nominatimAnswer : [],
    );
    const { places, report } = await run([place(), place({ id: "wat-arun", name: "Wat Arun" })], {
      lookup,
    });
    expect(places[0]?.coordinates).toBeUndefined();
    expect(places[1]?.coordinates).toEqual({ lat: 13.7463456, lng: 100.4927381 });
    expect(report.problems).toHaveLength(1);
    expect(report.problems[0]).toContain("wat-pho");
  });

  it("stops asking as soon as a candidate query hits", async () => {
    const lookup = vi.fn<Lookup>(async () => nominatimAnswer);
    await run([place({ name: "Golden Mount (Wat Saket)" })], { lookup });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("falls through to the next candidate when the first misses", async () => {
    const lookup = vi.fn<Lookup>(async (query) =>
      query.startsWith("Wat Saket") ? nominatimAnswer : [],
    );
    const { places, report } = await run([place({ name: "Golden Mount (Wat Saket)" })], { lookup });
    expect(places[0]?.coordinates).toEqual({ lat: 13.7463456, lng: 100.4927381 });
    expect(report.problems).toEqual([]);
  });
});
