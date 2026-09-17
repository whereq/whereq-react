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

You don't run a script. When changesets land on `main`, the
[`release.yml`](.github/workflows/release.yml) workflow opens (and keeps
updating) a **"release: version packages"** PR that applies the pending
changesets — bumping `package.json` and rewriting `CHANGELOG.md`.

**To release, merge that PR.** On the resulting push to `main`, the same workflow
sees no pending changesets and instead runs `pnpm run release` (build +
`changeset publish`), which:

- publishes to npm with `--access public` and provenance,
- pushes the `vX.Y.Z` git tag,
- creates the matching GitHub Release.

Watch it at <https://github.com/whereq/whereq-react/actions>.

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
