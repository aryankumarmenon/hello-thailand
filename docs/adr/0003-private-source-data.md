# 0003 — Private source data never enters the repo

- Status: accepted
- Date: 2026-09-15

## Context

The place list starts from a private research CSV. Besides public facts it has a free-text `Notes`
column with personal trip details. This repository is public, and git history keeps anything committed.

## Decision

- The import script reads the CSV from a path given in an environment variable. The CSV is never copied
  into the repo.
- The importer allowlists columns: Name, Region, Category, Address. `Notes` is never parsed. A fixture
  test proves a sentinel string in `Notes` never reaches any output.
- A privacy lint scans committed files against a denylist of private strings. The denylist is not committed:
  it is a gitignored local file and a CI secret. The lint runs in a pre-commit hook and in CI.
- Only content rewritten in own words, with public sources, is committed.

## Consequences

- A private detail needs two independent failures (allowlist and lint) to leak.
- The denylist must be kept current by hand when new private data appears.
- Rejected: relying on manual review alone.
