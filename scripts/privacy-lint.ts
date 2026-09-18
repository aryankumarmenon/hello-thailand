/**
 * Fail when a private string from the research data appears in this repo (ADR 0003).
 *
 * This is the second of the two independent defences. The first is the importer's column
 * allowlist; this one catches everything that arrives by another route — a pasted note, a
 * commit message quoted into a doc, a file copied by hand.
 *
 * The denylist itself is private, so it is never committed: it is read from the gitignored
 * .privacy-denylist file, or from the PRIVACY_DENYLIST environment variable in CI. A match
 * is reported by file and line only. The matched text is never printed, because that would
 * publish the very string this check exists to keep out of a public CI log.
 *
 *   pnpm tsx scripts/privacy-lint.ts            # every tracked file
 *   pnpm tsx scripts/privacy-lint.ts --staged   # what is about to be committed
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DENYLIST_FILE = ".privacy-denylist";

/** One entry per line. Blank lines and # comments are ignored, as are very short entries. */
export function parseDenylist(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map((line) => line.toLowerCase()),
    ),
  ];
}

export type Match = { line: number; entry: number };

/**
 * Find denylist entries in a file's text.
 *
 * The returned match names the entry by its position in the denylist, never by its value.
 */
export function scanText(text: string, denylist: string[]): Match[] {
  const matches: Match[] = [];
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const haystack = line.toLowerCase();
    for (const [entryIndex, entry] of denylist.entries()) {
      if (haystack.includes(entry)) matches.push({ line: index + 1, entry: entryIndex + 1 });
    }
  }
  return matches;
}

/** Entries short enough to appear in ordinary prose would fail on every file. */
export function tooShort(denylist: string[], minimum = 4): string[] {
  return denylist.filter((entry) => entry.length < minimum);
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function readDenylist(): string[] | undefined {
  const fromEnv = process.env["PRIVACY_DENYLIST"];
  if (fromEnv && fromEnv.trim().length > 0) return parseDenylist(fromEnv);
  try {
    return parseDenylist(readFileSync(DENYLIST_FILE, "utf8"));
  } catch {
    return undefined;
  }
}

function filesToScan(staged: boolean): string[] {
  const out = staged
    ? git(["diff", "--cached", "--name-only", "--diff-filter=ACM", "-z"])
    : git(["ls-files", "-z"]);
  return out.split("\0").filter((name) => name.length > 0);
}

/** Staged content, not the working tree: the commit is what must be clean. */
function readForScan(file: string, staged: boolean): string | undefined {
  try {
    const buffer = staged
      ? execFileSync("git", ["show", `:${file}`], { maxBuffer: 64 * 1024 * 1024 })
      : readFileSync(file);
    if (buffer.includes(0)) return undefined; // binary
    return buffer.toString("utf8");
  } catch {
    return undefined;
  }
}

function main(): void {
  const staged = process.argv.includes("--staged");
  const denylist = readDenylist();

  if (!denylist || denylist.length === 0) {
    const message = `privacy lint: no denylist. Create ${DENYLIST_FILE} (gitignored) or set PRIVACY_DENYLIST.`;
    // A missing denylist in CI means the check is not running at all, which must fail.
    if (process.env["CI"]) {
      console.error(`${message} A public build must not skip this check.`);
      process.exitCode = 1;
      return;
    }
    console.warn(`${message} Skipping.`);
    return;
  }

  const short = tooShort(denylist);
  if (short.length > 0) {
    console.error(
      `privacy lint: ${short.length} denylist entr(ies) are under 4 characters and would match ordinary text. Remove them.`,
    );
    process.exitCode = 1;
    return;
  }

  const hits: string[] = [];
  for (const file of filesToScan(staged)) {
    if (file === DENYLIST_FILE) continue;
    const text = readForScan(file, staged);
    if (text === undefined) continue;
    for (const match of scanText(text, denylist)) {
      // File and line only. The matched text stays out of the log.
      hits.push(`${file}:${match.line} matches denylist entry #${match.entry}`);
    }
  }

  if (hits.length > 0) {
    console.error(`privacy lint: ${hits.length} match(es) of private data (ADR 0003):`);
    for (const hit of hits) console.error(`  ${hit}`);
    console.error(
      "Remove the text. If it is already pushed, treat it as public: see docs/WORKFLOW.md.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`privacy lint: clean (${denylist.length} entries checked)`);
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main();
