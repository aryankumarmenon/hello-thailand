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

/** Ratios rounded to two places, exactly as the comments in `tokens.css` quote them. */
function quoted(fg: Rgb, bg: Rgb): number {
  return Number(contrast(fg, bg).toFixed(2));
}

describe("colour roles", () => {
  // Resolved through the role layer, because that is what every component consumes. A test
  // that read the palette directly would stay green while a repointed role broke the page.
  const bg = token("ht-bg");
  const surface = token("ht-surface");
  const surfaceDark = token("ht-surface-dark");
  const text = token("ht-text");
  const textOnDark = token("ht-text-on-dark");
  const accent = token("ht-accent");
  const accentTextOn = token("ht-accent-text-on");

  it.each([
    ["--ht-text on the page", text, bg],
    ["--ht-text on a surface", text, surface],
    ["--ht-text-on-dark on --ht-surface-dark", textOnDark, surfaceDark],
    ["--ht-accent-text-on on --ht-accent", accentTextOn, accent],
    ["--ht-accent on the page", accent, bg],
    ["--ht-accent on a surface", accent, surface],
  ])("%s clears AA for body text", (_label, fg, over) => {
    expect(contrast(fg as Rgb, over as Rgb)).toBeGreaterThanOrEqual(AA_BODY);
  });

  it("the accent is unreadable on the dark surface, which is why no component pairs them", () => {
    // Guards the rule rather than the colour: if someone lightens the accent until this
    // passes, the test says so and the Chip, Button and NumberBadge comments can be revisited.
    expect(contrast(accent, surfaceDark)).toBeLessThan(NON_TEXT);
  });

  it("the page colour on a surface has no edge of its own, so a card needs a border", () => {
    expect(contrast(bg, surface)).toBeLessThan(NON_TEXT);
  });
});

describe("freshness tokens", () => {
  const bg = token("ht-bg");
  const surface = token("ht-surface");

  // The pairs quoted in the tokens.css header. Asserting the number, not just the threshold,
  // is what stops the comment drifting away from the value that ships.
  it.each([
    ["ht-fresh", 6.44, 5.63],
    ["ht-aging", 5.93, 5.18],
    ["ht-stale", 7.55, 6.59],
    ["ht-unverified", 5.55, 4.85],
  ])("--%s clears AA on both page backgrounds, at the documented ratio", (name, on, over) => {
    expect(quoted(token(name as string, surface), surface)).toBe(on);
    expect(quoted(token(name as string, bg), bg)).toBe(over);
    expect(contrast(token(name as string, surface), surface)).toBeGreaterThanOrEqual(AA_BODY);
    expect(contrast(token(name as string, bg), bg)).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe("border tokens", () => {
  const bg = token("ht-bg");
  const surface = token("ht-surface");

  it("--ht-border-strong is load-bearing and clears the 3:1 non-text threshold", () => {
    expect(contrast(token("ht-border-strong", surface), surface)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrast(token("ht-border-strong", bg), bg)).toBeGreaterThanOrEqual(NON_TEXT);
    // tokens.css and Card.module.css both quote these two numbers.
    expect(quoted(token("ht-border-strong", surface), surface)).toBe(3.47);
    expect(quoted(token("ht-border-strong", bg), bg)).toBe(3.32);
  });

  it("--ht-border is decorative, and must never be the only signal", () => {
    expect(contrast(token("ht-border", surface), surface)).toBeLessThan(NON_TEXT);
  });
});
