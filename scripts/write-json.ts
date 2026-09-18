import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { format } from "prettier";

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
