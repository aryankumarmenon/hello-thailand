import { z } from "zod";

import { CheckedOn, Price, UNVERIFIED_PRICE } from "./price";

/**
 * One thing a traveller can visit, eat at or do (docs/CONTEXT.md).
 *
 * The schema is the single source of truth (ADR 0002): it validates the importer's
 * output, the committed content at build time, and later the AI structured output.
 *
 * Fields split in two. The core comes from the private research CSV through the
 * column allowlist (ADR 0003) and is always present. The editorial fields are added
 * by hand afterwards and stay optional, so an imported place is valid on day one and
 * grows as the content track fills it in.
 */

/** A slug: lowercase words joined by single hyphens. */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase hyphenated slug");

/** Cities with a page, matching the CSV's Region column. Bangkok is first (PLAN.md). */
export const CITY_SLUGS = [
  "bangkok",
  "phuket",
  "krabi-town",
  "ao-nang-railay",
  "ko-phi-phi",
] as const;

export const CitySlug = z.enum(CITY_SLUGS);
export type CitySlug = z.infer<typeof CitySlug>;

/**
 * Topics a place can carry. One per CSV Category to start with; the two-level
 * sidebar grouping comes later with the city explorer.
 *
 * "sleep" is deliberately absent: stays are out of scope, and the importer drops
 * those rows.
 */
export const TOPIC_SLUGS = [
  "eat",
  "drink",
  "sight",
  "temple",
  "shrine",
  "museum",
  "market",
  "nightlife",
  "live-music",
  "beach",
  "nature",
  "park",
  "viewpoint",
  "cave",
  "hike",
  "walk",
  "climbing",
  "diving",
  "snorkel",
  "muay-thai",
  "cooking",
  "activity",
  "day-trip",
  "village",
  "area",
  "transit",
  "safety",
] as const;

export const TopicSlug = z.enum(TOPIC_SLUGS);
export type TopicSlug = z.infer<typeof TopicSlug>;

/** Rough bounding box of Thailand, to catch a geocode that landed elsewhere. */
export const Coordinates = z.strictObject({
  lat: z.number().min(5.5).max(20.5),
  lng: z.number().min(97.3).max(105.7),
});
export type Coordinates = z.infer<typeof Coordinates>;

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const Weekday = z.enum(WEEKDAYS);
export type Weekday = z.infer<typeof Weekday>;

/** A 24-hour clock time, "HH:MM". Readable in hand-edited JSON; the planner converts. */
export const TimeOfDay = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'must be a 24-hour "HH:MM" time');

/**
 * One opening range on one day. `closes` earlier than `opens` means the range runs past
 * midnight, which is how a bar that shuts at 02:00 is written.
 */
const OpenOn = z
  .strictObject({ day: Weekday, opens: TimeOfDay, closes: TimeOfDay })
  // "00:00" to "00:00" is the one equal pair that means something: open all day. Any
  // other equal pair is a typo, since it would describe a zero-length opening.
  .refine((entry) => entry.opens !== entry.closes || entry.opens === "00:00", {
    message: 'opens and closes must differ, unless both are "00:00" for a 24-hour venue',
    path: ["closes"],
  });

/** A day the place is shut. Written out, so "closed Mondays" never reads as "not researched". */
const ClosedOn = z.strictObject({ day: Weekday, closed: z.literal(true) });

/**
 * One entry of a place's opening hours. The day planner asks "is this place open when the
 * route arrives?" so a closed place lands under "Does not fit today" with a reason.
 *
 * A day may hold more than one entry: a kitchen serving lunch and dinner is two ranges.
 * An absent day means the hours were never researched, which is not the same as closed.
 */
export const OpeningHoursEntry = z.union([OpenOn, ClosedOn]);
export type OpeningHoursEntry = z.infer<typeof OpeningHoursEntry>;

/** Minutes from midnight, so two ranges on one day can be compared. */
function minutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

export const OpeningHours = z
  .array(OpeningHoursEntry)
  .refine(
    (entries) => {
      const shut = new Set(entries.filter((e) => "closed" in e).map((e) => e.day));
      return !entries.some((e) => !("closed" in e) && shut.has(e.day));
    },
    { message: "a day marked closed must not also have opening hours" },
  )
  // Two overlapping ranges give the planner two answers to "is it open at 11:00?".
  .refine(
    (entries) => {
      for (const day of WEEKDAYS) {
        const ranges = entries
          .filter((e): e is { day: Weekday; opens: string; closes: string } => !("closed" in e))
          .filter((e) => e.day === day)
          .map((e) => {
            const from = minutes(e.opens);
            const to = minutes(e.closes);
            // A range past midnight ends the next day, so measure it as such.
            return { from, to: to <= from ? to + 24 * 60 : to };
          })
          .sort((a, b) => a.from - b.from);
        for (let i = 1; i < ranges.length; i += 1) {
          if (ranges[i]!.from < ranges[i - 1]!.to) return false;
        }
      }
      return true;
    },
    { message: "two opening ranges on the same day must not overlap" },
  );

export const Place = z.strictObject({
  // --- core: from the CSV column allowlist (ADR 0003) ---
  /** Stable id, also the URL segment: `/bangkok/wat-pho`. */
  id: Slug,
  name: z.string().min(1),
  city: CitySlug,
  topics: z.array(TopicSlug).min(1),
  address: z.string().min(1),
  /** `editorial` is written and checked by the site; `community` arrives later. */
  source: z.enum(["editorial", "community"]),

  // --- filled by the geocode step ---
  coordinates: Coordinates.optional(),
  /**
   * What the geocoder matched, kept so a reviewer can see whether the pin is the right
   * venue. Without it the evidence lives only in the cache, keyed by a query string
   * nobody will look up, and a confident wrong pin reads exactly like a right one.
   * Absent when the coordinates came from a hand-set override.
   */
  geocode: z
    .strictObject({ query: z.string().min(1), matched: z.string().min(1), fetchedOn: CheckedOn })
    .optional(),

  // --- editorial: added by hand, absent until the content track reaches this place ---
  /**
   * Travellers' area, as a slug such as `rattanakosin`. The day planner groups and
   * filters by exact equality, so " Silom " and "silom" must not both be writable.
   * A closed enum comes with M4, once the real Bangkok list exists.
   */
  neighbourhood: Slug.optional(),
  /** Editorial score, 1 to 5, for how worth visiting a place is. */
  popularity: z.int().min(1).max(5).optional(),
  /**
   * How long a visit takes, in minutes. The day planner spends this at a stop, so a
   * value longer than a day would silently consume every plan. Capped at 12 hours.
   */
  timeNeededMinutes: z.int().min(5).max(720).optional(),
  openingHours: OpeningHours.optional(),
  /** Own words, never guidebook text. */
  summary: z.string().min(1).optional(),
  scamAlert: z.string().min(1).optional(),
  price: Price.default(UNVERIFIED_PRICE),
});

export type Place = z.infer<typeof Place>;
