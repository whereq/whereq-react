# Releasing

`@whereq/react` releases are fully automated by [Changesets](https://github.com/changesets/changesets).
There is **one long-lived branch, `main`**. You never publish from a developer
machine and you never push directly to `main` — everything goes through PRs, and
CI does the publishing. npm credentials (`NPM_TOKEN`) live only in CI.

## The flow at a glance

```
 feature branch ──PR──▶ main ──▶ changesets bot opens/updates
   (+ changeset)                 "release: version packages" PR
                                 (bumps package.json + CHANGELOG.md)
                                        │  merge it
                                        ▼
                          .github/workflows/release.yml
                          build → changeset publish → npm
                          (+ git tag + GitHub Release, with provenance)
```

## Day-to-day (contributors)

1. Branch off `main` (e.g. `feat/modal`), make your change.
2. Record it with a changeset — this drives the version bump + CHANGELOG:
   ```bash
   pnpm changeset      # pick patch / minor / major, write a summary
   ```
   Commit the generated `.changeset/*.md` file with your PR. Docs-only or
   internal changes that shouldn't publish need no changeset.
3. Open a PR into `main`. CI runs `typecheck · lint · test · build`.
4. Merge after green + review.

## Cutting a release (maintainers)

Publishing always happens in CI ([`release.yml`](.github/workflows/release.yml)):
on any push to `main`, if there are **no** pending changesets it runs
`pnpm run release` (build + `changeset publish`) — publishing to npm with
`--access public` + provenance, pushing the `vX.Y.Z` tag, and creating the
GitHub Release. Credentials never leave CI.

The only choice is **how the version bump gets onto `main`**. Two equivalent
paths — pick whichever you like:

### Option A — from the CLI (one command)

Best for a solo maintainer. From a clean, up-to-date `main`:

```bash
bin/release.sh                      # consume pending changesets → bump → push
bin/release.sh --minor -m "Add Modal"   # no changeset yet? create one, then release
bin/release.sh --dry-run            # preview; change nothing
```

It green-bars, runs `changeset version` (bump + CHANGELOG), commits `release:
vX.Y.Z`, and pushes `main`. The push has no changesets left, so CI publishes.
The script never tags or publishes — CI does. Requires push access to `main`.

### Option B — merge the bot's PR (no CLI, works with protected `main`)

When changesets land on `main`, `release.yml` opens (and keeps updating) a
**"release: version packages"** PR that applies them. **Merge that PR** and the
next run of the workflow publishes. Best when `main` is protected or you have
multiple maintainers who want to review the version bump + CHANGELOG first.

Watch either at <https://github.com/whereq/whereq-react/actions>.

## One-time setup

1. **npm org + token** — create the `whereq` org on npmjs.com, generate an
   **Automation** access token, and add it as the repo secret **`NPM_TOKEN`**
   (Settings → Secrets and variables → Actions).
2. **Allow the Action to open PRs** — Settings → Actions → General → *Workflow
   permissions*: enable **"Allow GitHub Actions to create and approve pull
   requests"** (the changesets bot needs this to open the version PR).
3. **Branch protection** — protect `main` (require CI green + review). This is
   compatible with the flow: the bot's version PR is merged like any other PR,
   and publishing happens from the post-merge push, not a direct push.
4. **GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. The
   `docs.yml` workflow deploys the VitePress site (root) + Storybook
   (`/storybook/`) on every push to `main`.
5. **First publish** — `0.1.0` can be published manually once if it isn't on npm
   yet: `pnpm build && pnpm publish --access public`. Afterwards, every release
   goes through the automated flow above.

> Not using the `@whereq` npm org? Rename the package to `whereq-react` in
> `package.json` and everything else works unchanged.

## Notes

- **Version PR CI:** PRs opened by the built-in `GITHUB_TOKEN` don't trigger
  other workflows, so CI won't re-run on the auto-generated version PR. That's
  fine — its only change is the version bump + CHANGELOG, and `main` was already
  green when the feature PR merged.
- **`changeset publish` is idempotent:** it only publishes versions not already
  on npm, so a re-run of the workflow won't double-publish.
