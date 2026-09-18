import { describe, expect, it } from "vitest";

import { parseDenylist, scanText, tooShort } from "../../scripts/privacy-lint";

describe("parseDenylist", () => {
  it("takes one entry per line and ignores comments and blanks", () => {
    expect(
      parseDenylist("# private strings\nBooking ABC123\n\n  Somebody's Name  \n# end\n"),
    ).toEqual(["booking abc123", "somebody's name"]);
  });

  it("removes duplicates and lowercases, so matching is case-insensitive", () => {
    expect(parseDenylist("Wat Pho\nWAT PHO\nwat pho")).toEqual(["wat pho"]);
  });

  it("returns nothing for an empty file", () => {
    expect(parseDenylist("\n\n# only comments\n")).toEqual([]);
  });
});

describe("scanText", () => {
  const denylist = ["booking abc123", "12 privet drive"];

  it("finds a private string and reports its line", () => {
    const text = "line one\nthe reference is Booking ABC123\nline three";
    expect(scanText(text, denylist)).toEqual([{ line: 2, entry: 1 }]);
  });

  it("matches regardless of case", () => {
    expect(scanText("BOOKING abc123", denylist)).toEqual([{ line: 1, entry: 1 }]);
  });

  it("matches a string sitting inside other text", () => {
    expect(scanText("ref=Booking ABC123;paid", denylist)).toEqual([{ line: 1, entry: 1 }]);
  });

  it("reports every entry that matches on one line", () => {
    expect(scanText("Booking ABC123 at 12 Privet Drive", denylist)).toEqual([
      { line: 1, entry: 1 },
      { line: 1, entry: 2 },
    ]);
  });

  it("says nothing about a clean file", () => {
    expect(scanText("Wat Pho is open from 08:00.", denylist)).toEqual([]);
  });

  it("handles Windows line endings", () => {
    expect(scanText("clean\r\nBooking ABC123\r\n", denylist)).toEqual([{ line: 2, entry: 1 }]);
  });

  // The match names the entry by position. Its value must never reach a public CI log.
  it("never returns the matched text itself", () => {
    const matches = scanText("Booking ABC123", denylist);
    expect(JSON.stringify(matches)).not.toContain("abc123");
    expect(Object.keys(matches[0] ?? {})).toEqual(["line", "entry"]);
  });
});

describe("tooShort", () => {
  it("flags entries that would match ordinary prose", () => {
    expect(tooShort(["a", "the", "booking abc123"])).toEqual(["a", "the"]);
  });

  it("passes a denylist of real strings", () => {
    expect(tooShort(["booking abc123", "12 privet drive"])).toEqual([]);
  });
});
