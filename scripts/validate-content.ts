/**
 * Validate every committed content file against its schema (ADR 0002).
 *
 * Invalid content fails the build instead of reaching users, so this runs in `pnpm check`.
 *
 *   pnpm validate-content
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { GeocodeOverrides } from "./geocode";
import { Place } from "../src/domain/schemas/place";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export type Problem = { file: string; message: string };

/** Validate one file's text, naming every issue with the field path zod reports. */
export function validatePlaceFile(file: string, text: string): Problem[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return [{ file, message: `not valid JSON: ${error instanceof Error ? error.message : error}` }];
  }

  const parsed = Place.safeParse(json);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      file,
      message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    }));
  }

  // The file name is the id, so a rename cannot silently break a URL.
  const expected = `${parsed.data.id}.json`;
  const problems: Problem[] = [];
  if (path.basename(file) !== expected) {
    problems.push({ file, message: `file should be named ${expected} to match its id` });
  }
  if (path.basename(path.dirname(file)) !== parsed.data.city) {
    problems.push({ file, message: `file sits outside content/places/${parsed.data.city}` });
  }
  return problems;
}

async function placeFiles(): Promise<string[]> {
  const root = path.join(CONTENT_ROOT, "places");
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

async function main(): Promise<void> {
  const files = await placeFiles();
  const problems: Problem[] = [];
  const ids = new Map<string, string>();

  for (const file of files) {
    const text = await readFile(file, "utf8");
    problems.push(...validatePlaceFile(file, text));

    const parsed = Place.safeParse(JSON.parse(text));
    if (parsed.success) {
      const seen = ids.get(parsed.data.id);
      // Two places sharing an id would fight over one URL.
      if (seen) problems.push({ file, message: `id ${parsed.data.id} is already used by ${seen}` });
      else ids.set(parsed.data.id, path.relative(process.cwd(), file));
    }
  }

  const overridesPath = path.join(CONTENT_ROOT, "overrides", "geocode.json");
  try {
    const overrides = GeocodeOverrides.safeParse(JSON.parse(await readFile(overridesPath, "utf8")));
    if (!overrides.success) {
      problems.push(
        ...overrides.error.issues.map((issue) => ({
          file: overridesPath,
          message: `${issue.path.join(".")}: ${issue.message}`,
        })),
      );
    } else {
      for (const id of Object.keys(overrides.data)) {
        if (!ids.has(id)) {
          problems.push({ file: overridesPath, message: `override ${id} matches no place` });
        }
      }
    }
  } catch {
    // No overrides file yet is fine.
  }

  if (problems.length > 0) {
    console.error(`${problems.length} content problem(s):`);
    for (const { file, message } of problems) {
      console.error(`  ${path.relative(process.cwd(), file)} — ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`content: ${files.length} place(s) valid`);
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
