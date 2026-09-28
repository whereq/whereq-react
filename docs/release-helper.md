# Release Helper — Quick Reference

`bin/release.sh` is a local helper that takes a feature branch from
"some local work" to "PR open on GitHub". This page is the cheat sheet.
For the **full pipeline reference** (CI details, every scenario, troubleshooting),
see [CI/CD Pipeline](./ci-cd.md).

---

## TL;DR

```bash
# one-time, on a fresh feature branch
git checkout -b feat/my-thing
# … develop, write tests, run pnpm test locally …
pnpm changeset              # records the change for the CHANGELOG
git add . && git commit -m "feat(thing): …"

# the one command that does it all
bin/release.sh prepare      # squash + rebase + green-bar + push + open PR

# … review the PR on GitHub, merge it …
# … the bot opens "release: version packages", you merge that too …
# … release.yml publishes to npm automatically …

# optional: tag + GitHub Release
git checkout main && git pull --ff-only
bin/release.sh tag --release
```

That's the whole flow. Two PRs to merge, no `npm publish` on your machine.

---

## `prepare` — run on a feature branch

```bash
bin/release.sh prepare [--dry-run] [--yes] [--no-squash] [--no-push] [--no-pr]
```

What it does, in order:

| Step | What it asks you | What it actually does |
|---|---|---|
| Pre-flight | — | Refuses if you're on `main` or have a dirty tree |
| Fetch | — | `git fetch --prune --tags origin main <branch>` |
| Show commit count | — | `"feat/thing is 3 commit(s) ahead of origin/main"` |
| Squash | `Squash via interactive rebase? [y/N]` | Opens your `$EDITOR` with `git rebase -i origin/main` |
| Rebase | `Rebase onto origin/main? [y/N]` | `git rebase origin/main` |
| Changeset | `Run 'pnpm changeset' to record what changed? [y/N]` | Runs `pnpm changeset` interactively |
| Predict version | — | Parses changesets → `→ Next release will be: v0.5.0` |
| Green bar | — | `pnpm typecheck && pnpm lint && pnpm test` |
| Push | `Push feat/thing to origin? [y/N]` | `git push -u origin feat/thing` (or `--force-with-lease` if exists) |
| Create PR | `Create PR now? [y/N]` | `gh pr create --base main --head feat/thing --fill` |

End output:

```
✓ feat/thing is ready.

Next on GitHub:
  1. Reviewers approve the PR; merge it.
  2. The changesets bot opens "release: version packages" (bumps to v0.5.0).
  3. You review the CHANGELOG diff and merge that PR.
  4. release.yml runs → publishes @whereq/react@0.5.0 to npm.

Then, on main:
  bin/release.sh tag            # annotated tag + push
  bin/release.sh tag --release  # + GitHub Release page
```

### Flags

| Flag | Effect |
|---|---|
| `--dry-run` | Print every step, change nothing. Run this first to see what'll happen. |
| `--yes` | Skip all interactive confirms. Useful for automation. |
| `--no-squash` | Skip the interactive rebase (keep multiple commits on the branch). |
| `--no-push` | Don't push; you'll do it yourself. |
| `--no-pr` | Don't open the PR; you'll do it yourself. |

### Refuses to run when

- You're on `main` (it'll tell you to switch to a feature branch)
- Working tree is dirty (commit/stash/discard first)
- `origin` remote isn't configured

---

## `tag` — run on `main`

```bash
bin/release.sh tag [--dry-run] [--yes] [--no-push] [--release]
```

Run this **after** the bot's "release: version packages" PR is merged. It creates
an annotated `vX.Y.Z` tag (matching `package.json`) and pushes it.

| Step | What it does |
|---|---|
| Pre-flight | Refuses if you're not on `main`, or if local main ≠ origin/main |
| Fetch | `git fetch --prune --tags origin main` |
| Derive version | Reads `package.json#version` → `v0.5.0` (single source of truth) |
| Validate | Refuses if tag already exists locally **or** on `origin` |
| Create | `git tag -a v0.5.0 -m "Release v0.5.0 …"` (annotated) |
| Push | `git push origin refs/tags/v0.5.0` (NOT main) |
| `--release` | Also runs `gh release create v0.5.0 --generate-notes` for the GitHub Release page |

End output:

```
✓ Tagged v0.5.0 (0.5.0)
  - tag:    https://github.com/whereq/whereq-react/releases/tag/v0.5.0
  - commit: abc1234
```

### Why the script's tag is "optional"

`release.yml`'s `pnpm run release` → `changeset publish` already creates and
pushes a **lightweight** `v0.5.0` tag during npm publishing. So `bin/release.sh
tag` is purely for the human-readable git history + GitHub Release page. Skipping
it doesn't affect npm at all.

---

## Common flows

### Flow A — new feature (minor bump)

```bash
git checkout -b feat/cool-thing
# … develop …
pnpm changeset              # ← pick "minor", write a one-line user-facing summary
git add . && git commit -m "feat(cool): …"
bin/release.sh prepare
```

→ merges to `0.4.0 → 0.5.0` → npm publish by CI.

### Flow B — bug fix (patch bump)

Same as A, but `pnpm changeset` → pick `"patch"`.

→ merges to `0.5.0 → 0.5.1` → npm publish by CI.

### Flow C — breaking change (major bump)

Same as A, but `pnpm changeset` → pick `"major"`. Lead the summary with `BREAKING:`:

```
---
'@whereq/react': major
---

BREAKING: rename `thumbColor` to `thumbFg`. Update via sed or codemod.
```

→ merges to `0.5.x → 1.0.0` → npm publish by CI.

### Flow D — doc-only change (no npm bump)

```bash
git checkout -b docs/fix-typo
# edit docs/ or README.md
git add . && git commit -m "docs: …"
bin/release.sh prepare      # when prompted for changeset, answer n
```

→ merges to `main` → **no version PR**, **no npm publish**. docs.yml rebuilds the
site; that's it.

### Flow E — internal tooling change (no npm bump)

Same as D — change `bin/`, `scripts/`, `tsup.config.ts`, `eslint.config.js`,
`.github/workflows/*`, etc. No changeset, no npm bump.

---

## Daily driver

The most common 6 commands you'll type:

```bash
git checkout -b feat/x                # branch
pnpm changeset                        # record change
git add . && git commit -m "..."      # commit
bin/release.sh prepare                # the whole rest: cleanup + push + PR

# wait for CI green + review on GitHub

git checkout main && git pull          # after bot PR merges too
bin/release.sh tag --release           # annotated tag + GitHub Release page

npm view @whereq/react dist-tags      # confirm: { latest: '0.X.Y' }
```

---

## FAQ

**Q: I got `Working tree is dirty. Commit / stash / discard first.`**
A: You have uncommitted or untracked changes. Either `git add && git commit` them or `git stash` them.

**Q: `prepare` refuses to run because I'm on `main`.**
A: That's by design. Switch to your feature branch: `git checkout feat/<name>`.

**Q: `prepare` says "No .changeset/*.md found" and asks me to run `pnpm changeset`.**
A: For pure docs/tooling changes, decline (`n`). For anything user-facing, accept (`y`) and pick the bump type.

**Q: `tag` says "Tag v0.5.0 already exists locally/on origin".**
A: Either you double-ran, or `package.json` says the same version as a previous release. Bump the version first (via `pnpm changeset version` locally + commit, then let CI push) and re-run.

**Q: I want to skip the squash step but I have multiple commits.**
A: Pass `--no-squash`. The script will keep all commits as-is and just push.

**Q: Can I push without opening a PR?**
A: Pass `--no-pr`. The script will push and stop.

**Q: Can `prepare` open a draft PR?**
A: Not directly. Pass `--no-pr` and run `gh pr create --draft --fill` yourself.

**Q: The bot opened a "release: version packages" PR — what do I do?**
A: Just review the CHANGELOG diff (it's the only meaningful change) and merge. CI publishes immediately.

**Q: How do I publish without the GitHub UI?**
A: You don't, and you shouldn't. The whole point of this flow is that no single human can publish alone. Two PRs to merge, two humans approve, CI does the rest.

---

## See also

- [CI/CD Pipeline](./ci-cd.md) — the comprehensive reference for the whole flow
- [RELEASING.md](https://github.com/whereq/whereq-react/blob/main/RELEASING.md) — high-level overview
- [CONTRIBUTING.md](https://github.com/whereq/whereq-react/blob/main/CONTRIBUTING.md) — first-time contributor guide
