import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { format } from "prettier";

import { Place } from "../src/domain/schemas/place";

/**
 * Write a JSON file the way Prettier would.
 *
 * The scripts write files that are committed, and `pnpm check` runs `prettier --check`.
 * Formatting here means a re-import or a re-geocode can never leave the tree failing CI.
 */
export async function writeJson(file: string, value: unknown): Promise<void> {
  const text = await format(JSON.stringify(value, null, 2), { parser: "json", filepath: file });
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

/**
 * Write a place with its keys in the schema's own order.
 *
 * Both writers assemble a place by spreading and overwriting, so the key order depends on
 * how a record happened to be built: a pin added today lands after `price`, a pin
 * corrected today keeps its old position. Taking the order from `Place.shape` makes the
 * file identical whatever route produced it, so a re-run shows a diff only when something
 * actually changed. Reading the order from the schema means it cannot drift from it.
 */
export async function writePlace(file: string, place: Place): Promise<void> {
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(Place.shape)) {
    if (key in place) ordered[key] = (place as Record<string, unknown>)[key];
  }
  await writeJson(file, ordered);
}
