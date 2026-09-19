import { describe, expect, it } from "vitest";

import { Place } from "./place";

/** What the importer can know from the CSV allowlist alone. */
const imported = {
  id: "wat-pho",
  name: "Wat Pho",
  city: "bangkok",
  topics: ["temple"],
  address: "2 Sanam Chai Road, Phra Nakhon, Bangkok 10200",
  source: "editorial",
};

describe("Place", () => {
  it("accepts a freshly imported place with no editorial fields", () => {
    expect(Place.safeParse(imported).success).toBe(true);
  });

  it("defaults an imported place to an unverified price", () => {
    expect(Place.parse(imported).price).toEqual({ status: "unverified" });
  });

  it("accepts a fully filled editorial place", () => {
    const full = {
      ...imported,
      coordinates: { lat: 13.7465, lng: 100.4927 },
      neighbourhood: "rattanakosin",
      popularity: 5,
      timeNeededMinutes: 90,
      summary: "The reclining Buddha, and the country's oldest massage school.",
      scamAlert: "Ignore anyone at the gate who says the temple is closed today.",
      price: {
        thb: 300,
        label: "entry, adult",
        checkedOn: "2026-09-18",
        source: "https://www.watpho.com/en/",
      },
    };
    expect(Place.safeParse(full).success).toBe(true);
  });

  it("rejects a city that has no page", () => {
    expect(Place.safeParse({ ...imported, city: "pattaya" }).success).toBe(false);
  });

  // The importer drops Sleep rows, so "sleep" is not a topic the schema knows.
  it("rejects a sleep topic", () => {
    expect(Place.safeParse({ ...imported, topics: ["sleep"] }).success).toBe(false);
  });

  it("rejects a place with no topic", () => {
    expect(Place.safeParse({ ...imported, topics: [] }).success).toBe(false);
  });

  it("rejects an id that is not a slug", () => {
    expect(Place.safeParse({ ...imported, id: "Wat Pho" }).success).toBe(false);
    expect(Place.safeParse({ ...imported, id: "wat--pho" }).success).toBe(false);
    expect(Place.safeParse({ ...imported, id: "-wat-pho" }).success).toBe(false);
  });

  // strictObject: a typo in committed JSON fails the build instead of going unread.
  it("rejects an unknown field", () => {
    expect(Place.safeParse({ ...imported, neighborhood: "Rattanakosin" }).success).toBe(false);
  });

  it("keeps popularity inside 1 to 5", () => {
    expect(Place.safeParse({ ...imported, popularity: 1 }).success).toBe(true);
    expect(Place.safeParse({ ...imported, popularity: 5 }).success).toBe(true);
    expect(Place.safeParse({ ...imported, popularity: 0 }).success).toBe(false);
    expect(Place.safeParse({ ...imported, popularity: 6 }).success).toBe(false);
    expect(Place.safeParse({ ...imported, popularity: 4.5 }).success).toBe(false);
  });

  it("rejects coordinates outside Thailand", () => {
    // Lake Bled, Slovenia: the shape of a geocode that silently found the wrong place.
    expect(Place.safeParse({ ...imported, coordinates: { lat: 46.3, lng: 14.1 } }).success).toBe(
      false,
    );
  });

  describe("openingHours", () => {
    const hours = (...entries: unknown[]) =>
      Place.safeParse({ ...imported, openingHours: entries });

    it("accepts a normal day", () => {
      expect(hours({ day: "mon", opens: "08:00", closes: "18:30" }).success).toBe(true);
    });

    it("accepts a range that runs past midnight", () => {
      // A Bangla Road bar: open 21:00, shuts at 02:00 the next morning.
      expect(hours({ day: "sat", opens: "21:00", closes: "02:00" }).success).toBe(true);
    });

    it("accepts two ranges on one day", () => {
      expect(
        hours(
          { day: "tue", opens: "11:00", closes: "14:00" },
          { day: "tue", opens: "17:00", closes: "22:00" },
        ).success,
      ).toBe(true);
    });

    it("accepts a day written as closed", () => {
      expect(hours({ day: "mon", closed: true }).success).toBe(true);
    });

    it("rejects a day that is both closed and open", () => {
      expect(
        hours({ day: "mon", closed: true }, { day: "mon", opens: "09:00", closes: "17:00" })
          .success,
      ).toBe(false);
    });

    it("rejects closed: false, which says nothing", () => {
      expect(hours({ day: "mon", closed: false }).success).toBe(false);
    });

    it("rejects opens equal to closes", () => {
      expect(hours({ day: "mon", opens: "09:00", closes: "09:00" }).success).toBe(false);
    });

    it('accepts "00:00" to "00:00" as a 24-hour venue', () => {
      expect(hours({ day: "mon", opens: "00:00", closes: "00:00" }).success).toBe(true);
    });

    it("rejects two overlapping ranges on one day", () => {
      expect(
        hours(
          { day: "mon", opens: "09:00", closes: "18:00" },
          { day: "mon", opens: "10:00", closes: "12:00" },
        ).success,
      ).toBe(false);
    });

    it("still accepts two ranges that only touch", () => {
      expect(
        hours(
          { day: "mon", opens: "11:00", closes: "14:00" },
          { day: "mon", opens: "14:00", closes: "22:00" },
        ).success,
      ).toBe(true);
    });

    it("does not confuse a past-midnight range with an overlap", () => {
      expect(
        hours(
          { day: "sat", opens: "11:00", closes: "15:00" },
          { day: "sat", opens: "21:00", closes: "02:00" },
        ).success,
      ).toBe(true);
    });

    it("rejects a time that is not 24-hour HH:MM", () => {
      expect(hours({ day: "mon", opens: "9:00", closes: "17:00" }).success).toBe(false);
      expect(hours({ day: "mon", opens: "08:00", closes: "6pm" }).success).toBe(false);
      expect(hours({ day: "mon", opens: "24:00", closes: "25:00" }).success).toBe(false);
    });

    it("rejects an unknown day", () => {
      expect(hours({ day: "monday", opens: "08:00", closes: "18:00" }).success).toBe(false);
    });

    it("rejects an entry with no day", () => {
      expect(hours({ opens: "08:00", closes: "18:00" }).success).toBe(false);
    });
  });

  it("requires a neighbourhood to be a slug, so the planner can compare by equality", () => {
    expect(Place.safeParse({ ...imported, neighbourhood: "rattanakosin" }).success).toBe(true);
    expect(Place.safeParse({ ...imported, neighbourhood: "  Silom " }).success).toBe(false);
    expect(Place.safeParse({ ...imported, neighbourhood: "Silom" }).success).toBe(false);
  });

  it("keeps time needed inside a plausible visit", () => {
    expect(Place.safeParse({ ...imported, timeNeededMinutes: 90 }).success).toBe(true);
    expect(Place.safeParse({ ...imported, timeNeededMinutes: 1 }).success).toBe(false);
    expect(Place.safeParse({ ...imported, timeNeededMinutes: 100_000 }).success).toBe(false);
  });

  it("records what the geocoder matched", () => {
    const geocode = {
      query: "Wat Pho, Bangkok, Thailand",
      matched: "Wat Pho, Maha Rat Road, Bangkok",
      fetchedOn: "2026-09-18",
    };
    expect(Place.safeParse({ ...imported, geocode }).success).toBe(true);
    expect(
      Place.safeParse({ ...imported, geocode: { ...geocode, fetchedOn: "2099-01-01" } }).success,
    ).toBe(false);
  });

  it("rejects a price number with no source", () => {
    expect(Place.safeParse({ ...imported, price: { thb: 300, label: "entry" } }).success).toBe(
      false,
    );
  });
});
