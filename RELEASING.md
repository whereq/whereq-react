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

Releases go through a PR, like everything else — there is no release script and
no direct push to `main`.

When changesets land on `main`, [`release.yml`](.github/workflows/release.yml)
opens (and keeps updating) a **"release: version packages"** PR that applies the
pending changesets — bumping `package.json` and rewriting `CHANGELOG.md`. CI runs
on it.

**To release, review the changelog diff and merge that PR.** On the resulting
push to `main`, the same workflow finds no pending changesets and runs
`pnpm run release` (build + `changeset publish`), which:

- publishes to npm with `--access public` + provenance,
- pushes the `vX.Y.Z` git tag,
- creates the matching GitHub Release.

Watch it at <https://github.com/whereq/whereq-react/actions>.

## One-time setup

1. **npm org + token** — create the `whereq` org on npmjs.com, generate an
   **Automation** access token, and add it as the repo secret **`NPM_TOKEN`**
   (Settings → Secrets and variables → Actions).
2. **PAT for the version PR** — create a fine-grained Personal Access Token scoped
   to this repo with **Contents: read/write** and **Pull requests: read/write**,
   and add it as the repo secret **`CHANGESETS_TOKEN`**. This is required so the
   bot's "Version Packages" PR triggers CI (PRs opened by the default
   `GITHUB_TOKEN` do not — see Notes). Without it, a protected `main` that
   requires status checks can't merge the version PR.
3. **Allow the Action to open PRs** — Settings → Actions → General → *Workflow
   permissions*: enable **"Allow GitHub Actions to create and approve pull
   requests."**
4. **Branch protection** — protect `main` (Settings → Branches):
   - Require a pull request before merging
   - Require status checks to pass → select the CI job; require branches up to date
   - Require linear history · Block force pushes · Block deletions
   - **Do not allow bypassing the above settings** (enforce for admins too)
   - Required approvals: `0` while solo; raise to `1`+ once there's a second
     maintainer.
5. **GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. The
   `docs.yml` workflow deploys the VitePress site (root) + Storybook
   (`/storybook/`) on every push to `main`.
6. **First publish** — `0.1.0` can be published manually once if it isn't on npm
   yet: `pnpm build && pnpm publish --access public`. Afterwards, every release
   goes through the automated flow above.

> Not using the `@whereq` npm org? Rename the package to `whereq-react` in
> `package.json` and everything else works unchanged.

## Notes

- **Version PR CI:** PRs opened by the built-in `GITHUB_TOKEN` don't trigger other
  workflows. The `CHANGESETS_TOKEN` PAT (step 2) makes the version PR behave like
  a normal PR so required status checks run on it.
- **`changeset publish` is idempotent:** it only publishes versions not already
  on npm, so a re-run of the workflow won't double-publish.
