import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The milestone's "done when" is AA contrast in the light theme (docs/PLAN.md). A comment
 * claiming a ratio is not evidence, and a hand-checked palette drifts the first time
 * someone nudges a colour. So these tests read the shipped `tokens.css` and compute the
 * ratios from the values that actually ship.
 */

const CSS = readFileSync(join(__dirname, "tokens.css"), "utf8");

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const channel = (raw: number): number => {
    const v = raw / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** `color-mix(in srgb, X p%, Y)` mixes in sRGB, which is a straight per-channel blend. */
function mix(a: Rgb, b: Rgb, percentOfA: number): Rgb {
  const p = percentOfA / 100;
  return [0, 1, 2].map((i) => Math.round(a[i]! * p + b[i]! * (1 - p))) as Rgb;
}

/**
 * Reads a custom property out of `tokens.css` and resolves it to RGB. Handles the three
 * forms the file uses: a hex literal, `var(--other)`, and a `color-mix` of a var with a
 * colour. `transparent` is resolved against the background it is drawn on, which is what a
 * border actually does.
 */
function token(name: string, over: Rgb = [255, 255, 255]): Rgb {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(CSS);
  if (match === null) throw new Error(`token --${name} is not declared in tokens.css`);
  const raw = match[1]!.trim();

  if (raw.startsWith("#")) return hexToRgb(raw);

  const varOnly = /^var\(--([\w-]+)\)$/.exec(raw);
  if (varOnly !== null) return token(varOnly[1]!, over);

  // The second colour may itself be `var(--x)`, so it cannot be matched with [^)]+.
  const mixed = /^color-mix\(in srgb,\s*var\(--([\w-]+)\)\s*(\d+)%,\s*(.+)\)$/.exec(raw);
  if (mixed !== null) {
    const base = token(mixed[1]!, over);
    const percent = Number(mixed[2]);
    const second = mixed[3]!.trim();
    const other =
      second === "transparent" ? over : token(second.replace(/^var\(--|\)$/g, ""), over);
    return mix(base, other, percent);
  }

  throw new Error(`token --${name} has a form this test cannot resolve: ${raw}`);
}

const AA_BODY = 4.5;
const NON_TEXT = 3; // WCAG 1.4.11, for a boundary that identifies a component.

describe("colour tokens", () => {
  const beige = token("ht-beige");
  const navy = token("ht-navy");
  const white = token("ht-white");
  const red = token("ht-red");

  it.each([
    ["navy text on beige", navy, beige],
    ["navy text on white", navy, white],
    ["white text on navy", white, navy],
    ["beige text on navy", beige, navy],
    ["white text on red", white, red],
    ["red text on beige", red, beige],
    ["red text on white", red, white],
  ])("%s clears AA for body text", (_label, fg, bg) => {
    expect(contrast(fg as Rgb, bg as Rgb)).toBeGreaterThanOrEqual(AA_BODY);
  });

  it("red on navy is unreadable, which is why no component pairs them", () => {
    // Guards the rule rather than the colour: if someone lightens red until this passes,
    // the test says so and the Chip, Button and NumberBadge comments can be revisited.
    expect(contrast(red, navy)).toBeLessThan(NON_TEXT);
  });

  it("a beige surface on white has no edge of its own, so it needs a border", () => {
    expect(contrast(beige, white)).toBeLessThan(NON_TEXT);
  });
});

describe("freshness tokens", () => {
  const beige = token("ht-beige");
  const white = token("ht-white");

  it.each(["ht-fresh", "ht-aging", "ht-stale", "ht-unverified"])(
    "--%s clears AA on both page backgrounds",
    (name) => {
      expect(contrast(token(name, white), white)).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrast(token(name, beige), beige)).toBeGreaterThanOrEqual(AA_BODY);
    },
  );
});

describe("border tokens", () => {
  const beige = token("ht-beige");
  const white = token("ht-white");

  it("--ht-border-strong is load-bearing and clears the 3:1 non-text threshold", () => {
    expect(contrast(token("ht-border-strong", white), white)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrast(token("ht-border-strong", beige), beige)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it("--ht-border is decorative, and must never be the only signal", () => {
    expect(contrast(token("ht-border", white), white)).toBeLessThan(NON_TEXT);
  });
});
