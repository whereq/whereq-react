# Contributing to @whereq/react

Thanks for helping build WhereQ's open-source frontend library! 🎉

## Workflow

All changes land on `main` through a reviewed, CI-gated pull request — nobody
pushes to `main` directly.

1. **Fork** the repo (or, if you have write access, branch from `main`).
2. Create a branch: `git checkout -b feat/thing` (or `fix/…`, `docs/…`).
3. Make your change; keep the green bar clean (see below).
4. Add a **changeset** for any user-facing change (see [Changesets](#changesets)).
5. Open a PR into `main`. CI runs `typecheck · lint · test · build`; a maintainer
   reviews and merges.

Releases are cut by merging the automated "Version Packages" PR — see
[RELEASING.md](./RELEASING.md).

## Development

```bash
pnpm install
pnpm build         # bundle with tsup (ESM + CJS + d.ts)
pnpm test          # run vitest
pnpm test:watch    # watch mode
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint (zero warnings)
pnpm format        # prettier --write
```

The green bar for a PR is: `typecheck` + `lint` + `test` + `build`, all clean.

## Adding a component

1. Create `src/<component>/` with:
   - `<Component>.tsx` — the implementation
   - `<Component>.test.tsx` — tests (Vitest + Testing Library)
   - `index.ts` — public exports for the component
2. Re-export it from `src/index.ts`.
3. Add docs to `README.md`.
4. Keep it dependency-free where possible, accessible, and SSR-safe.

## Changesets

We version with [changesets](https://github.com/changesets/changesets). For any
user-facing change, add one:

```bash
pnpm changeset
```

Commit the generated file with your PR. Releases are published automatically from
`main` by the Release workflow when the "Version Packages" PR is merged.

## Commit style

Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
