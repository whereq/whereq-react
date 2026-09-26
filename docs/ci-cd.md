# CI/CD Pipeline

This is the **complete reference** for how changes flow from your laptop to npm.
It covers every scenario — bug fix, feature, breaking change, doc-only edit, urgent
hotfix, pre-release — and the exact commands and CI jobs each one triggers.

For a **quick-reference** of the local commands you'll type most days, see
[Release Helper](./release-helper.md). For the high-level overview, see
[RELEASING.md](https://github.com/whereq/whereq-react/blob/main/RELEASING.md).

---

## 1. Architecture at a glance

```
                   ┌───────────────────────────────────────────────┐
                   │                       GitHub                  │
                   │  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
                   │  │ ci.yml  │  │release  │  │   docs.yml    │  │
                   │  │         │  │  .yml   │  │ (VitePress +  │  │
                   │  │ verify  │  │changeset│  │  Storybook)   │  │
                   │  └─────────┘  └────────┬┘  └──────────────┘  │
                   │                        │                      │
                   └────────────────────────┼──────────────────────┘
                                            │
                  ┌─────────────────────────┴─────────────────────┐
                  │                                               │
                  ▼                                               ▼
           ┌────────────┐                                ┌──────────────┐
           │   npm      │                                │ GitHub Pages │
           │  registry  │                                │  (docs + sb) │
           └────────────┘                                └──────────────┘

  Developer (you)   ──▶ feat/*  ──PR──▶  main  ──▶ bot PR  ──merge──▶  npm publish
                     (local)            (1 PR)    (1 PR)
```

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | PR opened / updated / push to `main` | `pnpm typecheck · lint · test · build`. The "green bar". |
| `.github/workflows/release.yml` | push to `main` | Uses [`changesets/action@v1`](https://github.com/changesets/action). Either **opens/updates a "release: version packages" PR** (when changesets are pending) or **publishes to npm** (when no changesets remain). |
| `.github/workflows/docs.yml` | push to `main` | Builds VitePress + Storybook, deploys to GitHub Pages. |

---

## 2. The single-branch model

There is exactly **one long-lived branch: `main`**. Everything flows through it via PRs:

```
                  feat/* ──┐
                  feat/* ──┼──▶  main ──▶ npm
                  fix/*  ──┘
```

- **No `dev` branch.** `dev` exists historically (see RELEASING.md) but is dormant.
- **`main` is protected.** Direct pushes fail; only PRs land here.
- **The changesets bot opens a "release" PR.** This is a second PR you'll review and merge after your feature PR — it's what actually bumps the version and triggers publishing.

---

## 3. The two-PR release pattern

Every release follows the same two-PR rhythm:

```
                YOU                              BOT                       CI
                ──                              ────                     ─────

① Open PR #N: feat/* → main
   - includes .changeset/<name>.md
   - CI: typecheck · lint · test · build               ─────▶
                                                                       ✓ green
                                                                       ── merge ──▶
                ─────────── merge #N ─────────────────────────────────────────▶

② release.yml runs (on push to main):
   - changesets detected → version PR opened
   - commit:  release: version packages
   - bumps package.json, rewrites CHANGELOG.md
                                                                       ── merge ──▶
                ─────────── merge version PR ────────────────────────────────▶

③ release.yml runs again (on push to main):
   - no changesets left
   - pnpm run release → build → changeset publish
   - uploads to npm with provenance (OIDC)
   - publishes lightweight vX.Y.Z tag locally
                                                                       ✓ done
```

You never `npm publish` from your machine. Credentials live in CI as `NPM_TOKEN`.

---

## 4. Scenarios — what to do for each kind of change

Every scenario starts the same way: branch off `main`, develop, commit. They diverge at the **changeset step** and the **bump type**.

### 4.1 Bug fix (patch bump, e.g. 0.4.0 → 0.4.1)

```
patch   = 0.4.0  →  0.4.1   (bug fixes, internal refactors, perf improvements)
```

**When to use:** anything that fixes existing behavior without adding API surface or breaking it.

```bash
git checkout -b fix/scrollbar-autohide-flake
# edit src/scrollbar/Scrollbar.tsx
# add a regression test
pnpm changeset            # pick "patch", write: "Fix autohide flake on Firefox"
bin/release.sh prepare    # squash + rebase + green-bar + push + PR (all in one)
```

What hits npm: `0.4.1` once the bot's version PR merges. Patch bumps don't bump the minor, so consumers' `^0.4.0` ranges still resolve.

---

### 4.2 Feature (minor bump, e.g. 0.4.0 → 0.5.0)

```
minor   = 0.4.0  →  0.5.0   (new components, new optional props, new exports)
```

**When to use:** anything that adds API surface (new component, new prop, new helper export) without breaking existing usage.

```bash
git checkout -b feat/modal-component
# add src/modal/Modal.tsx, Modal.test.tsx, Modal.stories.tsx, index.ts
# add docs/components/modal.md
# export from src/index.ts
pnpm changeset            # pick "minor", write: "Add Modal component"
bin/release.sh prepare
```

What hits npm: `0.5.0`. Existing `^0.4.0` consumers do NOT auto-upgrade (the `^` lock excludes the minor), which is the intended safe-default behavior.

---

### 4.3 Breaking change (major bump, e.g. 0.4.0 → 1.0.0)

```
major   = 0.4.0  →  1.0.0   (renamed props, removed APIs, behavior changes)
```

**When to use:** any change that would break a consumer's existing code. This should be **rare** while the library is `0.x.y` (pre-1.0); once we hit `1.0.0`, breaking changes are reserved for genuine reasons.

```bash
git checkout -b refactor/rename-thumbColor-to-thumbFg
# find/replace across the codebase
# update tests, stories, docs
# update README's API table
pnpm changeset            # pick "major", write:
                          #   "BREAKING: rename `thumbColor` to `thumbFg`.
                          #    Update consumers via codemod or `sed`."
bin/release.sh prepare
```

What hits npm: `1.0.0`. Existing `^0.x` consumers do NOT auto-upgrade across the major.

**Pre-1.0 caveat:** for `0.x.y` libraries, semver treats minor as the breaking-change boundary. Our project uses strict semver regardless: only `major` is breaking. Document the breaking change loudly in the changeset summary either way.

---

### 4.4 Documentation-only change

```
no bump   (no changeset file at all)
```

**When to use:** typos in README, clarifying a doc sentence, fixing a Storybook arg default. **No code behavior changes.**

```bash
git checkout -b docs/fix-avatar-alt-text-example
# edit docs/components/avatar.md (or README.md)
git add . && git commit -m "docs(avatar): clarify alt-text example"
bin/release.sh prepare    # the script will warn: no .changeset/*.md; just say "n" to the prompt
```

What hits npm: **nothing.** The bot doesn't open a version PR because there's no changeset. Merging your docs PR into `main` is the entire flow — `docs.yml` rebuilds the site, `release.yml` runs but finds no changesets and exits without publishing. The package's `0.4.0` version stays put.

> **Tip:** the `bin/release.sh prepare` script will warn you about the missing changeset and offer to run `pnpm changeset`. Decline (answer `n`) for pure docs changes.

---

### 4.5 Internal tooling / build change

```
no bump   (no changeset file; never visible to consumers)
```

**When to use:** adding `bin/release.sh`, updating `tsup.config.ts`, swapping a dev dep, tweaking `eslint.config.js`. **No runtime API change.**

```bash
git checkout -b build/release-helper
# edit bin/release.sh, scripts/, .github/workflows/*
git add . && git commit -m "build(release): add prepare/tag subcommands"
bin/release.sh prepare    # decline the changeset prompt
```

Same as 4.4 — no version PR, no npm publish. CI still runs `ci.yml` (green-bar) and `docs.yml` (rebuild site if anything in `docs/` changed), but `release.yml` finds no changesets and exits cleanly.

> **Why this is "no bump":** consumers can't tell whether the package changed. Only the package's *runtime* behavior matters for semver; build tooling is invisible to npm.

---

### 4.6 Urgent hotfix (e.g. shipped package is broken)

```
patch   (always; hotfixes are bug fixes)
```

The flow is identical to 4.1, but the urgency is higher:

```bash
git checkout -b hotfix/scrollbar-crashes-on-null-children
# minimal patch + regression test
pnpm changeset            # "patch", write the user-facing impact clearly
bin/release.sh prepare --yes     # skip interactive confirms if you're racing
```

Then in the PR description:

> **Hotfix — please prioritize review.** Without this, every consumer using `<Scrollbar>` with `children={maybeNull}` crashes on render.

After CI green + merge, the bot's version PR is normally fast (within 30s). Merge that PR → release.yml publishes. **No special workflow for hotfixes;** the changesets flow handles urgency gracefully.

If you need to publish **right now** without waiting for review:
- Use a draft PR with title prefixed `[hotfix]` and request a maintainer
- OR push directly to a fix branch and ask a maintainer to merge
- OR (last resort) revert the broken release, fix, re-release as `X.Y.Z+1`

---

### 4.7 Pre-release / RC (e.g. `0.5.0-rc.1`, `1.0.0-beta.2`)

```
pre-release bump   (changeset CLI handles this with a config flag)
```

**When to use:** letting adventurous users try a breaking change before it's officially released; previewing a major; getting feedback on a `feat:` that's not yet stable.

This project doesn't pre-release by default, but the flow works the same:

```bash
pnpm changeset pre enter rc      # sets the next bump to pre-release mode
pnpm changeset                   # write the changeset as usual
bin/release.sh prepare
# … merge PRs normally …
# After the bot's version PR merges, release.yml runs `changeset publish`
# with --tag=rc, putting 0.5.0-rc.1 on the `rc` npm dist-tag
pnpm changeset pre exit          # back to stable mode
```

Consumers opt in explicitly:
```bash
npm install @whereq/react@rc
```

Tag in git:
```bash
git checkout main && git pull --ff-only
bin/release.sh tag
```

---

## 5. The local helper: `bin/release.sh`

A single bash script with two subcommands. Lives at `bin/release.sh`; documented
inline via `bin/release.sh --help`. **Never merges into main, never touches npm** —
those are CI's jobs.

### 5.1 `bin/release.sh prepare` — run on a feature branch

```bash
$ bin/release.sh prepare
→ release.sh: prepare
→   branch: feat/cool-thing (clean)
→ Fetching origin + tags
→ feat/cool-thing is 3 commit(s) ahead of origin/main
→   [y] squash via interactive rebase?
→   [y] rebase onto origin/main?
✓ Changesets on this branch:
    - cool-thing.md: minor
→ Next release will be: v0.5.0
→ Local green bar: typecheck ✓ lint ✓ test ✓
→   [y] push to origin (--force-with-lease if already pushed)?
→   [y] open PR with `gh pr create --fill`?

✓ feat/cool-thing is ready.
```

What it covers end-to-end:

| Step | What it does | Skippable with |
|---|---|---|
| Pre-flight | clean tree, on a feature branch, origin reachable | (refuses if violated) |
| Fetch | `git fetch --prune --tags origin main <branch>` | — |
| Local commit count | reports `X commit(s) ahead of origin/main` | — |
| Squash | `git rebase -i origin/main` (your `$EDITOR` opens) | `--no-squash` |
| Rebase | `git rebase origin/main` | always asks |
| Changeset check | refuses to proceed without `.changeset/*.md` | `--no-changesets` (skipped) |
| Version prediction | parses changesets, computes `vX.Y.Z` | — |
| Green bar | `pnpm typecheck && pnpm lint && pnpm test` | — |
| Push | `git push -u origin <branch>` or `--force-with-lease` | `--no-push` |
| PR creation | `gh pr create --fill` (auto-fills title/body from commits) | `--no-pr` |

Global flags (apply to either subcommand): `--dry-run`, `--yes`.

### 5.2 `bin/release.sh tag` — run on `main` after the bot's version PR merges

```bash
$ bin/release.sh tag
→ release.sh: tag
→   branch: main (clean)
→ origin/main is in sync @ abc1234
→ About to tag
→   HEAD:                abc1234
→   package.json version: 0.5.0
→   tag (will create):   v0.5.0 (annotated)
→   [y] create and push v0.5.0?

✓ Tagged v0.5.0
```

What it does:
1. Confirms you're on `main` and in sync with `origin/main`.
2. Derives the tag from `package.json#version` (single source of truth — never typed by hand).
3. Refuses if the tag already exists locally **or** on `origin`.
4. Creates an **annotated** tag with a real message (so `git describe` and `gh release create` work).
5. Pushes the tag (NOT main; main is already on `origin` via the version PR merge).
6. Optional: `--release` flag also runs `gh release create vX.Y.Z --generate-notes` for the GitHub Release page.

### 5.3 The two-subcommand invariant

```
bin/release.sh prepare  →  runs on feat/*       →  ends with PR opened on GitHub
bin/release.sh tag      →  runs on main         →  ends with annotated vX.Y.Z tag pushed
```

**Never run `prepare` on main** (the script refuses). **Never run `tag` on a feature branch** (the script refuses). Both refuse a dirty tree. Both bail out cleanly on any error.

---

## 6. NPM publishing — what happens behind the scenes

```
                                                      CI's release.yml
                                                      ────────────────
                                                  ┌────────────────────┐
                                                  │  pnpm changeset    │
                                                  │  version           │
                                                  └─────────┬──────────┘
                                                            │ bumps package.json
                                                            │ rewrites CHANGELOG.md
                                                            │ commits
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  bot opens PR      │
                                                  │  "release: version │
                                                  │   packages"        │
                                                  └─────────┬──────────┘
                                                            │ you merge it
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  release.yml       │
                                                  │  detects no        │
                                                  │  changesets left    │
                                                  └─────────┬──────────┘
                                                            │
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  pnpm run release  │
                                                  │  = build &&        │
                                                  │    changeset       │
                                                  │    publish         │
                                                  └─────────┬──────────┘
                                                            │
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  npm publish       │
                                                  │  (with OIDC        │
                                                  │   provenance)      │
                                                  └────────────────────┘
```

The `publish` step is:
- `pnpm run release` (from `package.json`): `pnpm run build && changeset publish`
- `pnpm run build`: tsup bundles ESM + CJS + `.d.ts`, then `scripts/prepend-use-client.mjs` prepends `"use client"`
- `changeset publish`: uploads `./dist/` to the npm registry using `NODE_AUTH_TOKEN=$NPM_TOKEN`, with `NPM_CONFIG_PROVENANCE=true` for OIDC attestation
- `changeset publish` also runs `git tag vX.Y.Z` (lightweight) and pushes it — that's why the script's `tag` subcommand is "optional polish" not "required for publishing"

### Required GitHub secrets

| Secret | Purpose | Set once at |
|---|---|---|
| `NPM_TOKEN` | npm Automation token, scoped to `@whereq/react` with **Read and write (publish and stage)** permissions, **Bypass 2FA** enabled | repo → Settings → Secrets → Actions |
| `CHANGESETS_TOKEN` | Fine-grained PAT, scoped to the repo with Contents R/W + Pull requests R/W. Needed so the bot's PR triggers CI (default `GITHUB_TOKEN` PRs don't) | same |

If `NPM_TOKEN` ever gets the E404 ("Not Found") on PUT: regenerate the token, ensuring the package scope is explicit (`@whereq/react`, not just "All packages"). See [§9 Troubleshooting](#9-troubleshooting).

---

## 7. Tag strategy (best practice)

| Rule | Why |
|---|---|
| Tag **only `main`**, never feature branches | Tags are immutable; branches move. Tagging `feat/avatar` gives you a `v0.2.0` that doesn't match the published state. |
| Always **annotated** (`git tag -a …`) | Annotated tags carry tagger + message + timestamp; `git describe` and `gh release create` rely on this. Lightweight tags are wrong for releases. |
| Tag = **derived from `package.json#version`**, never typed | `bin/release.sh tag` reads package.json and computes `vX.Y.Z`. Mismatch fails immediately. |
| **One tag per release**, never reuse | Need to fix? Cut `v0.5.1`. |
| **No prefix noise** | `v0.5.0` IS the release tag. Don't use `release-v0.5.0` or `v0.5.0-final`. |
| Pre-release tags follow semver | `v0.5.0-rc.1`, `v1.0.0-beta.2`. Pair with `npm install @whereq/react@rc`. |

Annotated tags vs lightweight:

| Property | Lightweight (`git tag v0.5.0`) | Annotated (`git tag -a v0.5.0 -m "..."`) |
|---|---|---|
| Pointer to commit | ✓ | ✓ |
| Stores tagger name/email | ✗ | ✓ |
| Stores date | ✗ | ✓ |
| Stores message | ✗ | ✓ |
| Works with `git describe` | sometimes | ✓ |
| Used by `gh release create` | weak | ✓ |
| Used by Changesets | ✓ (lightweight is the default) | ✓ |

`bin/release.sh tag` always creates an annotated tag; `changeset publish` creates a lightweight one. Both work; the script's annotated tag is for human-readable git history, not for npm.

---

## 8. The full sequence — reference table

A single change flows through these states. Use this table to debug where you're stuck.

| State | Where | Who | Action |
|---|---|---|---|
| 0 | local | you | `git checkout -b feat/<name>`, develop |
| 1 | local | you | `pnpm changeset` (records change in `.changeset/*.md`) |
| 2 | local | you | `git add && git commit` |
| 3 | local | you | `bin/release.sh prepare` (squash + rebase + green-bar + push + PR) |
| 4 | GitHub PR | reviewers | review, CI green, **merge** the feature PR |
| 5 | GitHub Actions | `release.yml` | detects changeset, opens bot PR "release: version packages" |
| 6 | GitHub PR | you | review the CHANGELOG diff in the bot's PR, **merge** it |
| 7 | GitHub Actions | `release.yml` | no changesets left → `pnpm run release` → `npm publish` |
| 8 | npm | npm | `@whereq/react@X.Y.Z` is live with provenance |
| 9 | local | you | `git checkout main && git pull --ff-only` |
| 10 | local | you | `bin/release.sh tag` (annotated `vX.Y.Z`) |
| 11 | GitHub | you (optional) | `bin/release.sh tag --release` also runs `gh release create --generate-notes` |

States 4, 6, 8, 11 each need a human action. The rest is automation.

---

## 9. Troubleshooting

### E404 on `npm publish` ("PUT https://registry.npmjs.org/@whereq/react - Not found")

The `NPM_TOKEN` secret doesn't have write access for `@whereq/react`. Common causes:

| Cause | Fix |
|---|---|
| Token was created under a different account/org than the package owner | Reissue the token under the correct account |
| Granular token: package scope was left at default ("No access") | When generating, click **"Add packages and scopes"**, type `@whereq/react`, set permission to **Read and write (publish and stage)** |
| Token is from before this package existed | Reissue |
| 2FA is enabled on the token (CI can't enter the OTP) | Tick **"Bypass two-factor authentication"** when generating the granular token |

After fixing, **Re-run jobs** on the failed `release.yml` run in the Actions tab. Do NOT make a new commit just to retrigger.

### "Conflicts that must be resolved" on a PR

Your branch fell behind `origin/main`. Run `bin/release.sh prepare` — its interactive rebase step handles this. Or do it manually:

```bash
git fetch origin main
git rebase origin/main
# resolve any conflicts, then:
git rebase --continue
git push --force-with-lease
```

### Version PR was merged but `release.yml` didn't publish

Check the Actions tab — the workflow should have a run on the merge commit. If it shows "skipped", the bot didn't think there were any pending publishes (e.g., you double-merged or the version didn't actually change). Re-run the latest release.yml job; `changeset publish` is idempotent and will skip if the version is already on npm.

### `bin/release.sh prepare` says "No commits to release"

You're on a feature branch with 0 commits ahead of `origin/main` — nothing to ship. Switch to the right branch.

### `bin/release.sh tag` says "Tag vX.Y.Z already exists locally/on origin"

The version in `package.json` is the same as a previous release. Either you double-bumped, or you need to actually bump the version (the bot does this via changesets). If you really want to recreate the tag locally: `git tag -d vX.Y.Z`, but never delete a tag that's on `origin` — that breaks consumers' "install at exact version" behavior.

---

## 10. Best practices

1. **One changeset per logical change.** If your PR has two unrelated improvements, write two `.changeset/*.md` files (both will be consumed by the same bot PR, producing one combined entry in CHANGELOG.md under the same version).
2. **Be honest in changeset summaries.** They become the public CHANGELOG. Write for consumers, not for yourself.
3. **Commit messages ≠ changeset summaries.** Commit messages describe code history (`fix: clamp thumb radius to 0 for size=0`). Changeset summaries describe user-facing impact (`Fix Scrollbar throwing when size is 0`). Both matter; they're for different audiences.
4. **Always `bin/release.sh prepare`** — even for one-commit branches. It catches forgotten changesets and runs the green-bar for you.
5. **Don't push directly to `main`.** The repo is branch-protected; it'll reject your push anyway, and if it didn't, the bot wouldn't get a chance to open its version PR.
6. **For breaking changes, lead with the breaking impact in the changeset summary.** Example: `BREAKING: <Prop> renamed to <NewProp>. Codemod: …`.
7. **Rotate `NPM_TOKEN` and `CHANGESETS_TOKEN` annually.** Tokens don't expire automatically; set calendar reminders.
8. **Watch the Actions tab after every merge.** Two workflow runs (`release.yml`, `docs.yml`) should appear. If one fails, that's the signal to investigate.

---

## 11. Security

- **`NPM_TOKEN`** has publish rights for `@whereq/react`. Treat it like a production DB password. It's stored encrypted in GitHub Secrets and only injected into the `release.yml` job's env. It is **never** logged or echoed by the script.
- **`CHANGESETS_TOKEN`** is a GitHub PAT with Contents R/W + PRs R/W. Same handling.
- **Provenance**: every release ships with an OIDC-signed provenance statement linking the npm tarball to the exact GitHub Actions run that built it. Consumers can verify the artifact's origin. `NPM_CONFIG_PROVENANCE=true` enables this — keep it on.
- **Two-person review**: a bot PR + a feature PR means *two* humans (you + reviewer) approved any change before npm saw it. Don't bypass the PR UI even under time pressure.
- **No credentials on developer machines.** If a developer laptop is compromised, the attacker can push code but **cannot publish to npm** without the GitHub-hosted secrets.

---

## 12. Reference — file index

| Path | What it is |
|---|---|
| `.github/workflows/ci.yml` | Green-bar: typecheck · lint · test · build |
| `.github/workflows/release.yml` | The `changesets/action@v1` runner: opens version PR or publishes to npm |
| `.github/workflows/docs.yml` | VitePress + Storybook deploy to GitHub Pages |
| `.changeset/` | Holds pending changesets; README + config.json always present |
| `.changeset/config.json` | Changesets config (`baseBranch: main`, `access: public`) |
| `bin/release.sh` | Local helper: `prepare` and `tag` subcommands |
| `scripts/prepend-use-client.mjs` | Post-build: adds `"use client"` to bundle for RSC compatibility |
| `tsup.config.ts` | Bundle config (ESM + CJS + .d.ts) |
| `RELEASING.md` | High-level release overview |
| `CONTRIBUTING.md` | Contributor workflow (fork, branch, changeset, PR) |
| `docs/release-helper.md` | Quick reference for `bin/release.sh` |

---

## 13. See also

- [Release Helper (quick reference)](./release-helper.md) — the TL;DR of `bin/release.sh`
- [RELEASING.md](https://github.com/whereq/whereq-react/blob/main/RELEASING.md) — high-level overview
- [CONTRIBUTING.md](https://github.com/whereq/whereq-react/blob/main/CONTRIBUTING.md) — for first-time contributors
- [Changesets docs](https://github.com/changesets/changesets) — the underlying versioning tool
