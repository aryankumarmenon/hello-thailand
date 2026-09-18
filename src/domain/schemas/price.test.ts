import { describe, expect, it } from "vitest";

import { Price } from "./price";

const verified = {
  thb: 500,
  label: "entry, adult",
  checkedOn: "2026-09-18",
  source: "https://www.example.org/tickets",
};

describe("Price", () => {
  it("accepts a verified price with all four fields", () => {
    expect(Price.parse(verified)).toEqual(verified);
  });

  it("accepts free entry as thb 0", () => {
    expect(Price.safeParse({ ...verified, thb: 0 }).success).toBe(true);
  });

  it("accepts the unverified case", () => {
    expect(Price.parse({ status: "unverified" })).toEqual({ status: "unverified" });
  });

  // ADR 0002: there is no way to store a number without a source.
  it("rejects a number without a source", () => {
    expect(
      Price.safeParse({ thb: 500, label: "entry, adult", checkedOn: "2026-09-18" }).success,
    ).toBe(false);
  });

  it("rejects a number without checkedOn", () => {
    expect(
      Price.safeParse({
        thb: 500,
        label: "entry, adult",
        source: "https://www.example.org/tickets",
      }).success,
    ).toBe(false);
  });

  it("rejects a source that is not a URL", () => {
    expect(Price.safeParse({ ...verified, source: "the ticket office" }).success).toBe(false);
  });

  it("rejects a checkedOn that is not an ISO date", () => {
    expect(Price.safeParse({ ...verified, checkedOn: "18-09-2026" }).success).toBe(false);
  });

  it("rejects a negative or fractional thb", () => {
    expect(Price.safeParse({ ...verified, thb: -1 }).success).toBe(false);
    expect(Price.safeParse({ ...verified, thb: 12.5 }).success).toBe(false);
  });

  it("rejects a verified price that also carries unverified status", () => {
    expect(Price.safeParse({ ...verified, status: "unverified" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(Price.safeParse({ status: "pending" }).success).toBe(false);
  });

  it("rejects an empty label", () => {
    expect(Price.safeParse({ ...verified, label: "" }).success).toBe(false);
  });
});
