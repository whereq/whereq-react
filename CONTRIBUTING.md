# Contributing to @whereq/react

Thanks for helping build WhereQ's open-source frontend library! 🎉

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
