import { mkdtemp, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  mergeWithExisting,
  parseAllowedRows,
  slugify,
  toPlaces,
  writePlaces,
} from "../../scripts/import-csv";
import type { Place } from "../../src/domain/schemas/place";

const FIXTURE = path.join(__dirname, "..", "fixtures", "places-with-notes.csv");

/** The string that stands in for personal trip detail in the Notes column (ADR 0003). */
const SENTINEL = "SENTINEL-PRIVATE-NOTE-MUST-NEVER-BE-COMMITTED";

async function readFixture(): Promise<string> {
  return readFile(FIXTURE, "utf8");
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

describe("the Notes column never reaches any output", () => {
  it("has a sentinel in every fixture row, so the test can actually fail", async () => {
    const csv = await readFixture();
    const dataLines = csv.trimEnd().split("\n").slice(1);
    expect(dataLines.length).toBeGreaterThan(0);
    expect(dataLines.every((line) => line.includes(SENTINEL))).toBe(true);
  });

  it("drops Notes at the parser: it never becomes a key", async () => {
    const rows = parseAllowedRows(await readFixture());
    for (const row of rows) {
      expect(Object.keys(row)).not.toContain("Notes");
    }
    expect(JSON.stringify(rows)).not.toContain(SENTINEL);
  });

  it("keeps the sentinel out of the mapped places", async () => {
    const { places, skipped, problems } = toPlaces(parseAllowedRows(await readFixture()));
    expect(JSON.stringify({ places, skipped, problems })).not.toContain(SENTINEL);
  });

  it("keeps the sentinel out of every file written to disk", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hello-thailand-import-"));
    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    await writePlaces(places, root);

    const written = await filesUnder(root);
    expect(written.length).toBeGreaterThan(0);
    for (const file of written) {
      expect(await readFile(file, "utf8")).not.toContain(SENTINEL);
    }
  });
});

describe("parseAllowedRows", () => {
  it("strips the UTF-8 BOM, so the first column is Name and not \\uFEFFName", async () => {
    const rows = parseAllowedRows(await readFixture());
    expect(Object.keys(rows[0] ?? {})).toEqual(["Name", "Region", "Category", "Address"]);
    expect(rows[0]?.Name).toBe("Temple of the Test Case");
  });

  it("reads a quoted field that contains a comma", async () => {
    const rows = parseAllowedRows(await readFixture());
    const market = rows.find((row) => row.Name === "Sample Weekend Market");
    expect(market?.Address).toBe("3 Made-Up Road, Chatuchak");
  });
});

describe("a CSV whose shape cannot be trusted is refused", () => {
  const withBom = (body: string) => `\ufeffName,Region,Category,Address,Notes\n${body}`;

  // The leak the column allowlist cannot catch: once a row is short, Notes IS column four.
  it("refuses a row with too few fields instead of shifting Notes into Address", () => {
    expect(() => parseAllowedRows(withBom("Short Row,Bangkok,Temple,PRIVATE-NOTE-TEXT\n"))).toThrow(
      /would move Notes into Address/,
    );
  });

  it("names the line, so the CSV can be fixed", () => {
    const body = "Fine Row,Bangkok,Temple,1 Road,note\nShort Row,Bangkok,Temple,PRIVATE\n";
    expect(() => parseAllowedRows(withBom(body))).toThrow(/line 3/);
  });

  it("refuses a row with too many fields", () => {
    expect(() => parseAllowedRows(withBom("Wide Row,Bangkok,Temple,1 Road,note,extra\n"))).toThrow(
      /Invalid Record Length/,
    );
  });

  it("refuses a header whose columns have been reordered", () => {
    expect(() =>
      parseAllowedRows("\ufeffName,Category,Region,Address,Notes\nA,Temple,Bangkok,1 Road,n\n"),
    ).toThrow(/column 2 is "Category", expected "Region"/);
  });

  it("refuses a header whose column has been renamed", () => {
    expect(() =>
      parseAllowedRows("\ufeffName,Region,Category,Location,Notes\nA,Bangkok,Temple,1 Road,n\n"),
    ).toThrow(/column 4 is "Location", expected "Address"/);
  });

  it("refuses an empty file", () => {
    expect(() => parseAllowedRows("")).toThrow(/no header row/);
  });

  it("still accepts a well-formed CSV", () => {
    const rows = parseAllowedRows(withBom("Good Row,Bangkok,Temple,1 Road,a private note\n"));
    expect(rows).toEqual([
      { Name: "Good Row", Region: "Bangkok", Category: "Temple", Address: "1 Road" },
    ]);
  });
});

describe("toPlaces", () => {
  it("drops Sleep rows and says why", async () => {
    const { places, skipped } = toPlaces(parseAllowedRows(await readFixture()));
    expect(places.some((place) => place.name === "Placeholder Guesthouse")).toBe(false);
    expect(skipped).toContainEqual({
      name: "Placeholder Guesthouse",
      reason: "category Sleep is out of scope",
    });
  });

  it("maps the CSV Region to a city and the Category to a topic", async () => {
    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    const musicBar = places.find((place) => place.name === "Fictional Music Bar");
    expect(musicBar?.city).toBe("phuket");
    expect(musicBar?.topics).toEqual(["live-music"]);
  });

  it("gives two places with the same name distinct ids", async () => {
    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    const ids = places
      .filter((place) => place.name === "Temple of the Test Case")
      .map((place) => place.id);
    expect(ids).toEqual(["temple-of-the-test-case", "temple-of-the-test-case-2"]);
  });

  it("reports an unknown Region instead of dropping the row silently", async () => {
    const { places, problems } = toPlaces(parseAllowedRows(await readFixture()));
    expect(places.some((place) => place.name === "Nowhere In Particular")).toBe(false);
    expect(problems.join("\n")).toContain('unknown Region "Pattaya"');
  });

  it("imports a place with an unverified price and no editorial fields", async () => {
    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    const bay = places.find((place) => place.name === "Imaginary Bay");
    expect(bay?.price).toEqual({ status: "unverified" });
    expect(bay?.popularity).toBeUndefined();
    expect(bay?.source).toBe("editorial");
  });
});

describe("slugify", () => {
  it("makes a URL-safe id", () => {
    expect(slugify("Wat Pho")).toBe("wat-pho");
    expect(slugify("Ko Phi Phi Don")).toBe("ko-phi-phi-don");
    expect(slugify("Cabbages & Condoms")).toBe("cabbages-and-condoms");
    expect(slugify("Café Crème")).toBe("cafe-creme");
    expect(slugify("  Jim Thompson's House  ")).toBe("jim-thompson-s-house");
  });
});

describe("mergeWithExisting", () => {
  const imported: Place = {
    id: "wat-pho",
    name: "Wat Pho",
    city: "bangkok",
    topics: ["temple"],
    address: "2 Sanam Chai Road, Phra Nakhon, Bangkok",
    source: "editorial",
    price: { status: "unverified" },
  };

  it("returns the imported place when nothing is committed yet", () => {
    expect(mergeWithExisting(imported, undefined)).toEqual(imported);
  });

  it("keeps editorial work and coordinates through a re-import", () => {
    const existing: Place = {
      ...imported,
      address: "an older address",
      coordinates: { lat: 13.7465, lng: 100.4927 },
      neighbourhood: "rattanakosin",
      popularity: 5,
      timeNeededMinutes: 90,
      summary: "The reclining Buddha.",
      price: {
        thb: 300,
        label: "entry, adult",
        checkedOn: "2026-09-18",
        source: "https://www.watpho.com/en/",
      },
    };

    const merged = mergeWithExisting(imported, existing);

    // The CSV owns the core fields.
    expect(merged.address).toBe(imported.address);
    // Everything a person wrote or the geocoder found survives.
    expect(merged.coordinates).toEqual(existing.coordinates);
    expect(merged.neighbourhood).toBe("rattanakosin");
    expect(merged.popularity).toBe(5);
    expect(merged.summary).toBe("The reclining Buddha.");
    expect(merged.price).toEqual(existing.price);
  });

  it("keeps editorial topics and re-adds the CSV one", () => {
    const existing: Place = { ...imported, topics: ["sight", "walk"] };
    expect(mergeWithExisting(imported, existing).topics).toEqual(["temple", "sight", "walk"]);
  });

  it("does not duplicate a topic that is already there", () => {
    const existing: Place = { ...imported, topics: ["temple", "sight"] };
    expect(mergeWithExisting(imported, existing).topics).toEqual(["temple", "sight"]);
  });
});

describe("writePlaces", () => {
  it("writes one JSON file per place, under its city", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hello-thailand-write-"));
    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    await writePlaces(places, root);

    const bangkok = await readdir(path.join(root, "bangkok"));
    expect(bangkok).toContain("temple-of-the-test-case.json");
    const raw = await readFile(path.join(root, "bangkok", "temple-of-the-test-case.json"), "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(JSON.parse(raw).name).toBe("Temple of the Test Case");
  });

  it("overwrites a stale file rather than leaving two copies", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hello-thailand-write-"));
    await mkdir(path.join(root, "bangkok"), { recursive: true });
    await writeFile(path.join(root, "bangkok", "temple-of-the-test-case.json"), "{}\n", "utf8");

    const { places } = toPlaces(parseAllowedRows(await readFixture()));
    await writePlaces(places, root);

    const raw = await readFile(path.join(root, "bangkok", "temple-of-the-test-case.json"), "utf8");
    expect(JSON.parse(raw).name).toBe("Temple of the Test Case");
  });
});
