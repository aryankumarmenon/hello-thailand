import { describe, expect, it } from "vitest";

import { validatePlaceFile } from "../../scripts/validate-content";

const valid = {
  id: "wat-pho",
  name: "Wat Pho",
  city: "bangkok",
  topics: ["temple"],
  address: "2 Sanam Chai Road, Bangkok",
  source: "editorial",
  price: { status: "unverified" },
};

const at = (id = "wat-pho", city = "bangkok") => `content/places/${city}/${id}.json`;

describe("validatePlaceFile", () => {
  it("passes a valid place", () => {
    expect(validatePlaceFile(at(), JSON.stringify(valid))).toEqual([]);
  });

  it("reports broken JSON instead of throwing", () => {
    const problems = validatePlaceFile(at(), "{ not json");
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain("not valid JSON");
  });

  it("names the field that failed", () => {
    const problems = validatePlaceFile(at(), JSON.stringify({ ...valid, popularity: 9 }));
    expect(problems[0]?.message).toContain("popularity");
  });

  it("catches a price with no source", () => {
    const bad = { ...valid, price: { thb: 300, label: "entry" } };
    expect(validatePlaceFile(at(), JSON.stringify(bad)).length).toBeGreaterThan(0);
  });

  it("requires the file name to match the id", () => {
    const problems = validatePlaceFile(at("wat-arun"), JSON.stringify(valid));
    expect(problems[0]?.message).toContain("should be named wat-pho.json");
  });

  it("requires the file to sit under its city", () => {
    const problems = validatePlaceFile(at("wat-pho", "phuket"), JSON.stringify(valid));
    expect(problems[0]?.message).toContain("outside content/places/bangkok");
  });
});
