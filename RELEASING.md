# Releasing

`@whereq/react` uses a **`dev` → `main` → tag → CI publish** pipeline. Publishing
credentials live only in CI — never on a developer's machine.

## Branch model

| Branch | Role                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `dev`  | Integration branch. All feature PRs target `dev`. CI runs on every push. |
| `main` | Release branch. Only `bin/release.sh` promotes `dev` → `main` + tags.    |

Protect both branches (require CI green + PR review) in **Settings → Branches**.

## Day-to-day

1. Branch off `dev`, make your change.
2. Record it with a changeset (this drives the version bump + CHANGELOG):
   ```bash
   pnpm changeset      # pick patch / minor / major, write a summary
   ```
3. Open a PR into `dev`. CI runs `typecheck · lint · test · build`.

## Cutting a release

From an up-to-date, clean `dev`:

```bash
bin/release.sh                 # consume pending changesets → version → tag → push
bin/release.sh --minor -m "Add Modal"   # no changeset yet? create one, then release
bin/release.sh --dry-run       # preview everything, change nothing
```

`bin/release.sh` (modeled on `flowdesk.top/bin/release.sh`):

1. Verifies you're on a clean `dev`, in sync with origin.
2. Runs the green bar (`typecheck · lint · test · build`).
3. Runs `changeset version` → bumps `package.json` + writes `CHANGELOG.md`.
4. Commits `release: vX.Y.Z`, fast-forwards `main` from `dev`, pushes both.
5. Creates and pushes the annotated tag `vX.Y.Z`.

The **`v*` tag** triggers `.github/workflows/publish.yml`, which re-verifies, then
runs `pnpm publish --access public --provenance` and creates a GitHub Release.

```
 dev ──(feature PRs + changesets)──▶ bin/release.sh ──▶ main + tag vX.Y.Z
                                                              │
                                            publish.yml ──────┴──▶ npm + GitHub Release
```

## One-time setup

1. **npm org + token** — create the `whereq` org on npmjs.com, generate an
   **Automation** access token, and add it as the repo secret **`NPM_TOKEN`**
   (Settings → Secrets and variables → Actions).
2. **GitHub Pages** — Settings → Pages → Source: **GitHub Actions**. The
   `docs.yml` workflow deploys the VitePress site (root) + Storybook (`/storybook/`)
   on every push to `main`.
3. **First publish** — either run `bin/release.sh --minor` from `dev`, or publish
   `0.1.0` manually once: `pnpm build && pnpm publish --access public`.

> Not using the `@whereq` npm org? Rename the package to `whereq-react` in
> `package.json` and everything else works unchanged.
