# Workflow

How a change gets from a branch into `main`: branches, commits, rebasing, pull requests, reviews and merging.
`CLAUDE.md` has the short version. Words such as MUST and SHOULD follow RFC 2119.

## Branches

- `main` is the only long-lived branch. Nobody commits to `main` directly. Every change reaches it through a
  pull request with CI green.
- Branch names are lowercase with hyphens:
  - milestone work: `m<number>-<slug>`, for example `m1-data-pipeline`
  - docs only: `docs-<slug>`
  - tooling, agents, dependencies, CI: `chore-<slug>`
  - a bug fix outside a milestone: `fix-<slug>`
- One owner per branch. Only the owner pushes to it. Rebasing is safe only because of this rule.
- Start every branch from the latest `main`, without tracking `main`:

  ```bash
  git fetch origin
  git switch --no-track -c m1-data-pipeline origin/main
  git push -u origin m1-data-pipeline
  ```

  Without `--no-track`, the new branch tracks `main`: `git pull` then pulls `main` into it, and `git status`
  compares it with the wrong branch.

- Delete the branch after it is merged.

## Commits

- One logical step per commit, so each step can be reviewed and reverted alone.
- Subject: imperative, at most 72 characters, for example "Add Price schema with verified and unverified
  cases". Body: why, when the reason is not obvious.
- Stage files by path and read `git diff --staged` before you commit. You MUST NOT use `git add -A` or
  `git add .`: private files such as `CLAUDE.local.md` sit next to tracked files.
- Commit with your personal GitHub identity.
- Run `pnpm check && pnpm build` before every push.

## Keep a branch up to date: rebase

Rebase moves your commits so they start from the newest `main`. The history stays a straight line, and the
pull request shows only your work.

```bash
git fetch origin
git rebase origin/main
pnpm check && pnpm build
git push --force-with-lease
```

- You MUST push a rebased branch with `--force-with-lease`, never `--force`. It refuses to overwrite commits on
  GitHub that you have not fetched.
- You MUST NOT rebase `main`, or a branch that another person has pushed to.
- Rebase before you open a pull request, and again when `main` changes files that your branch also changes.
- To bring `main` into your branch, rebase. Do not merge `main` into it.
- On a conflict: fix the file, `git add <file>`, then `git rebase --continue`. To stop and go back to where you
  started: `git rebase --abort`. After a rebase with conflicts, run check and build again before you push.
- Before a large rebase, keep a pointer to the old state: `git branch backup-<branch>`. `git reflog` also
  lists earlier positions of the branch.

## Stacked branches

Use a stack when a branch needs work that is not merged yet. Example: M4 needs the components from M2-lite.

1. Start the second branch from the first: `git switch --no-track -c m4-bangkok-pages m2-lite-components`.
2. Open its pull request with the first branch as the base.
3. After the first branch merges, move the second branch onto `main`:
   - The first branch was squash-merged: `git rebase --onto origin/main m2-lite-components m4-bangkok-pages`.
     A plain rebase would try to apply the first branch's commits again and conflict.
   - The first branch was merged another way: `git rebase origin/main`.
4. Change the pull request base to `main`, then push with `--force-with-lease`.

Keep a stack to two branches.

## Pull requests

- Open a pull request only after `pnpm check && pnpm build` pass locally.
- Title: what the change does. Body: summary, any decision changes, and the verification output.
- Milestone work updates `docs/STATUS.md` in the same pull request.
- A pull request that changes `docs/DECISIONS.md` MUST have the other owner's approval.

### Reviews before you open or update a pull request

| The change touches                                                                              | Run                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Any code                                                                                        | `/code-review` for bugs                                                  |
| `scripts/`, `src/server/`, `src/app/api/`, `src/env/`, `.github/`, `.gitignore`, `package.json` | `security-reviewer` agent; `/security-review` for a broader generic pass |
| `content/`, or a script that writes content                                                     | `content-reviewer` agent                                                 |
| New domain logic, or the test plan for a milestone                                              | `/engineering:testing-strategy` (engineering plugin)                     |
| A new ADR                                                                                       | `/engineering:architecture` (engineering plugin)                         |
| M7 ship or any production deploy                                                                | `/engineering:deploy-checklist` (engineering plugin)                     |
| Every pull request, as the last step                                                            | `pr-readiness` agent                                                     |

- Run an agent with `@agent-security-reviewer`, or ask Claude to "use the security-reviewer agent on this
  branch".
- The agents live in `.claude/agents/` and are committed, so both owners have them. Engineering plugin skills
  are installed per person; skip those rows if you do not have the plugin.
- The agents report and never edit. You decide which findings to fix.

## Merging a pull request

TODO(human): choose the merge method for this repository and write the rule here in 2–4 lines.

## When something goes wrong

- **Private data or a secret is in a commit that is not pushed:** remove it, then `git commit --amend`, or
  `git reset --soft HEAD~1` and commit again.
- **It is already pushed:** treat it as public. Rotate the secret first and tell the other owner. A new
  commit that deletes it does not remove it from history, and GitHub or forks may keep copies. Rewriting
  history needs both owners to agree.
- **You committed on local `main` by mistake:** save the work first with `git branch fix-<slug>`, check that
  `git log fix-<slug>` shows the commit, then `git switch main` and `git reset --hard origin/main`.
- **You changed files on the wrong branch and have not committed:** `git stash`, `git switch <branch>`,
  `git stash pop`.
