# CountryFlag

An inline-SVG country flag chip. Renders identically on any device — no emoji or
system-font dependency, so the chip looks the same on a Windows screenshot, a
Linux server, a watchOS widget, or a print stylesheet.

> 🧪 Try every prop live in the [Storybook](/storybook/).

## Usage

```tsx
import { CountryFlag } from '@whereq/react'

;<CountryFlag country="us" />
;<CountryFlag country="cn" size={28} shape="circle" />
;<CountryFlag country="eu" alt="European Union" />
```

The shared registry covers 40+ major economies + the `na` / `eu` continent
pseudo-codes. Unknown slugs render the continent emblem as a safe fallback so
the chip never goes empty.

Browse the full list via the exported `FLAG_CATALOG` (name-sorted):

```ts
import { FLAG_CATALOG } from '@whereq/react'

FLAG_CATALOG.slice(0, 3)
// [
//   { slug: 'ar', name: 'Argentina' },
//   { slug: 'au', name: 'Australia' },
//   { slug: 'be', name: 'Belgium' },
// ]
```

## Shapes & sizes

The SVG preserves a 24:16 aspect ratio at every size. `shape` maps to the
wrapper's `border-radius`:

- `rect` — square corners (default-ish for chip rows)
- `rounded` — small radius (the default; matches whereq.cc chip styling)
- `circle` — fully rounded (good for avatar-style use)

```tsx
<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
  <CountryFlag country="us" shape="rect" />
  <CountryFlag country="us" shape="rounded" />
  <CountryFlag country="us" shape="circle" />
</div>
```

## Props

Extends `React.HTMLAttributes<HTMLSpanElement>` (minus `children`).

| Prop        | Type                                  | Default      | Description                                                              |
| ----------- | ------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `country`   | `string`                              | —            | ISO 3166-1 alpha-2 (`"us"`, `"cn"`) or continent (`"na"`, `"eu"`).         |
| `size`      | `number`                              | `20`         | Width in px. Height is `size × 2/3` to preserve the 24:16 flag ratio.    |
| `shape`     | `'rect' \| 'rounded' \| 'circle'`     | `'rounded'`  | CSS `border-radius` applied to the wrapper.                              |
| `fit`       | `'contain' \| 'slice'`               | `'contain'`  | SVG `preserveAspectRatio`. `slice` crops to fill the wrapper.            |
| `alt`       | `string`                              | country name | Accessible label override.                                               |
| `svgProps`  | `SVGProps<SVGSVGElement>` subset      | —            | Spreads onto the inner `<svg>` after our defaults (skip viewBox/role/etc). |

Any extra prop (`className`, `style`, `id`, `data-*`, event handlers) passes
through to the wrapper `<span>`. A forwarded `ref` points at the wrapper.

## Exported helpers

```ts
import {
  lookupFlag,     // (slug) => FlagEntry | undefined
  isSupported,    // (slug) => boolean (case-insensitive)
  FLAG_CATALOG,   // ReadonlyArray<{slug, name}>, name-sorted
  SUPPORTED_SLUGS, // string[], alphabetised
  FLAG_VIEWBOX,   // '0 0 24 16' (the standard SVG aspect)
  star5,          // (cx, cy, r) => string  — shared 5-point star polygon helper
} from '@whereq/react'
```

## Notes

- **Accessibility** — the wrapper is `role="img"` with `aria-label` set to
  `alt ?? country_name ?? country.toUpperCase()`. The inner `<svg>` is
  `aria-hidden="true"` to avoid duplicate announcements.
- **Ref** — `forwardRef<HTMLSpanElement, …>`. Points at the wrapper, not the SVG.
- **SSR-safe** — pure inline SVG, no stylesheet injection, no DOM access at render.
- **Determinism** — every flag is a hand-curated SVG. No emoji, no system font, no
  image fetch. Same render in every browser and every Node render test.
- **Extend** — add an entry in `flags.ts`'s `FLAGS` registry and either
  compose it from the existing `verticalStripes` / `horizontalStripes`
  helpers, or write a custom builder for non-trivial geometry (the US flag
  and Union Jack are reference implementations).

## Adding a flag

To register a new country (or replace a simple one), edit `src/country-flag/flags.ts`:

```ts
FLAGS.pl = { slug: 'pl', name: 'Poland', build: () => horizontalStripes(['#fff', '#dc143c']) }
FLAGS.kw = { slug: 'kw', name: 'Kuwait', build: () => {
    // ...custom inline SVG body...
    return <g>{/* ... */}</g>
} }
```

Slugs are lowercase ISO 3166-1 alpha-2 codes (or `na`/`eu`). Names are the
human-readable English form. `build()` returns the inner `<g>` element that
the component mounts inside the shared `<svg viewBox="0 0 24 16">`.

For simple patterns, the built-in helpers (`verticalStripes`, `horizontalStripes`)
produce hundreds of flags from one-liners. For non-trivial geometry (stars,
canton, Nordic cross), drop down to a custom function.
