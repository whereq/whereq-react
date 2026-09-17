# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@whereq/react` is a lightweight, tree-shakeable React component library published to npm. It ships ESM + CJS + `.d.ts` and targets React >= 18 (peer dependency). Components are UI primitives extracted from [whereq.cc](https://whereq.cc) — currently a native-scrollbar container and an Avatar.

## Commands

Package manager is **pnpm** (`pnpm@9`). Node >= 18.

```bash
pnpm run build       # tsup bundle → dist/, then prepend "use client" (see below)
pnpm run dev         # tsup --watch
pnpm run typecheck   # tsc --noEmit
pnpm run lint        # eslint . --max-warnings 0  (warnings fail)
pnpm run format      # prettier --write
pnpm run test        # vitest run (jsdom)
pnpm run test:watch  # vitest
pnpm run storybook   # storybook dev on :6006
pnpm run docs:dev    # VitePress site in docs/
```

Run a single test file / test:

```bash
pnpm vitest run src/avatar/Avatar.test.tsx
pnpm vitest run src/scrollbar -t "auto-hide"   # filter by test name
```

CI (`.github/workflows/ci.yml`) runs, in order: `typecheck · lint · test · build`. Match that locally before pushing.

## Architecture

### Module layout

Each component lives in its own folder under `src/<component>/` with a consistent shape:

- `Component.tsx` — the React component(s)
- `types.ts` — all exported prop/option types for that module
- `styles.ts` — pure, framework-agnostic style logic (CSS strings, color/token math, injection helpers). **No JSX here.**
- `index.ts` — the module's public surface (components + selected helpers + types)
- `Component.test.tsx`, `Component.stories.tsx`

`src/index.ts` is the package entry and just re-exports each module's `index.ts` flat, so consumers `import { Scrollbar, Avatar } from '@whereq/react'`. When adding a component, follow this same folder pattern and wire it into `src/index.ts`.

### Styling model (important, non-obvious)

The library injects raw CSS into `document.head` rather than shipping a stylesheet or using a CSS-in-JS runtime:

- **Scrollbar** styles the *native* scrollbar (`::-webkit-scrollbar`, `scrollbar-width`/`scrollbar-color`) — there is no scroll hijacking, so keyboard/wheel/touch/a11y are untouched. The base stylesheet (`scrollbarCss`) is injected **once** via `ensureScrollbarStyles()`; all per-instance variation (size, colors, radius) flows through `--wq-sb-*` CSS custom properties set inline on the element. This is why the stylesheet is static.
- Style injection uses **`useInsertionEffect`** (not `useEffect`/`useLayoutEffect`) so styles land before the browser paints, avoiding a flash of the default scrollbar.
- `GlobalScrollbar` is a render-nothing component wrapping `injectGlobalScrollbarStyles`, which is idempotent (replaces its `<style>` on re-invoke) and returns a cleanup function.
- All injection helpers are SSR-safe: they no-op when `typeof document === 'undefined'`.
- Theme presets live in `styles.ts` (`THEMES`, `AVATAR_PALETTE`, `STATUS_COLORS`). `theme="auto"` uses the CSS `light-dark()` function, so it only adapts if the page declares a `color-scheme`.

### `"use client"` handling

The build target is RSC/Next.js App Router. Components use hooks + the DOM, so the bundle needs a `"use client"` directive. **tsup's `banner` option is stripped by the bundler** as a module-level directive, so `scripts/prepend-use-client.mjs` prepends it to `dist/index.js` and `dist/index.cjs` as a post-build step. `pnpm run build` chains this automatically — if you invoke `tsup` directly, the directive will be missing.

### Public API discipline

Everything intended for consumers is exported through the module `index.ts` files, including pure helpers (`resolveColors`, `buildGlobalScrollbarCss`, `initialsFromName`, `colorFromName`, `radiusFor`, etc.) and all types. Adding a new export means adding it to the relevant `index.ts`. Keep `styles.ts` logic pure and testable — the tests exercise these helpers directly.

## Release process

Single-branch model driven by **Changesets** (see `RELEASING.md`). There is one long-lived branch, `main`; nobody pushes to it directly or publishes from a dev machine.

- Feature branches → PR into `main`. Record every user-facing change with `pnpm changeset` (drives the version bump + CHANGELOG); commit the `.changeset/*.md` file with the PR.
- PR-only: `main` is protected; nobody pushes to it directly (including releases). `.github/workflows/release.yml` (the `changesets/action`) runs on push to `main`: with pending changesets it opens/updates a **"release: version packages"** PR (bump + CHANGELOG); with **no** pending changesets it runs `pnpm run release` (`build` + `changeset publish`) → publishes to npm with provenance, pushes the `vX.Y.Z` tag, creates a GitHub Release.
- **Releasing = merging that version PR.** The action uses the `CHANGESETS_TOKEN` PAT so the version PR triggers CI (the default `GITHUB_TOKEN` wouldn't). See `RELEASING.md`.
- `pnpm run release` = `tsup` build + `changeset publish`. Publish credentials live only in CI (`NPM_TOKEN`); provenance via OIDC (`NPM_CONFIG_PROVENANCE`).
- `changeset publish` is idempotent (won't re-publish an existing version).

## Conventions

- Prettier config (`.prettierrc.json`): no semicolons, single quotes, 2-space indent, width 100.
- ESLint enforces `@typescript-eslint/consistent-type-imports` (use `import type { … }`) and `--max-warnings 0`.
- Components use `forwardRef` and spread remaining DOM props (extend the appropriate `React.HTMLAttributes<…>`).
