<div align="center">

# @whereq/react

**WhereQ's open-source React component library.**
Lightweight, accessible, themeable UI primitives — starting with a beautiful thin **Scrollbar**.

[![npm version](https://img.shields.io/npm/v/@whereq/react.svg)](https://www.npmjs.com/package/@whereq/react)
[![npm downloads](https://img.shields.io/npm/dm/@whereq/react.svg)](https://www.npmjs.com/package/@whereq/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@whereq/react)](https://bundlephobia.com/package/@whereq/react)
[![license](https://img.shields.io/npm/l/@whereq/react.svg)](./LICENSE)
[![types](https://img.shields.io/npm/types/@whereq/react.svg)](https://www.npmjs.com/package/@whereq/react)
[![CI](https://github.com/whereq/whereq-react/actions/workflows/ci.yml/badge.svg)](https://github.com/whereq/whereq-react/actions/workflows/ci.yml)

📖 [Docs](https://whereq.github.io/whereq-react/) · 🧪 [Storybook](https://whereq.github.io/whereq-react/storybook/)

</div>

---

The `Scrollbar` was extracted from [whereq.cc](https://whereq.cc), our privacy-first
photo gallery. It styles the **native** scrollbar — no scroll hijacking — so wheel,
keyboard, touch, and accessibility all keep working, with zero runtime scroll math.

- 🪶 **Tiny & dependency-free** — one `<div>`, native scrollbars, a few bytes of CSS.
- 🎨 **Themeable** — light/dark/auto presets, or full control via colour props / CSS variables.
- 🌗 **Auto light-dark** — the default adapts to the page's `color-scheme`.
- 🙈 **Auto-hide** — optionally reveal the thumb only on hover / while scrolling.
- ♿ **Accessible & native** — real scrollbars, real keyboard & screen-reader behaviour.
- 🧩 **SSR-safe & RSC-ready** — ships a `"use client"` boundary; styles inject before paint.
- 🔠 **First-class TypeScript** — full types, ESM + CJS.

## Install

```bash
npm install @whereq/react
# or
pnpm add @whereq/react
# or
yarn add @whereq/react
```

> `react >= 18` is a peer dependency.

## Usage

### `<Scrollbar>` — a scoped scroll container

```tsx
import { Scrollbar } from '@whereq/react'

export function Sidebar() {
  return (
    <Scrollbar style={{ maxHeight: 320 }}>
      {/* any tall content */}
      <ul>{/* … */}</ul>
    </Scrollbar>
  )
}
```

Auto-hide + a thicker, rounded thumb, adapting to light/dark:

```tsx
<Scrollbar autoHide size={8} theme="auto" style={{ maxHeight: '70vh' }}>
  <Content />
</Scrollbar>
```

Horizontal, with custom colours:

```tsx
<Scrollbar axis="horizontal" thumbColor="#17a2ae" thumbHoverColor="#0f7f89">
  <Row />
</Scrollbar>
```

### `<GlobalScrollbar>` — style every scrollbar on the page

Reproduces the whereq.cc app-wide look. Mount it once near your root; it renders nothing.

```tsx
import { GlobalScrollbar } from '@whereq/react'

export function App() {
  return (
    <>
      <GlobalScrollbar theme="auto" size={6} />
      <Routes />
    </>
  )
}
```

Prefer an imperative call (e.g. outside React)? Use `injectGlobalScrollbarStyles`:

```ts
import { injectGlobalScrollbarStyles } from '@whereq/react'

const cleanup = injectGlobalScrollbarStyles({ theme: 'dark', size: 6 })
// cleanup() removes the styles
```

## API

### `<Scrollbar>` props

Extends `React.HTMLAttributes<HTMLDivElement>` (so `className`, `style`, `onScroll`, `ref`, … all work).

| Prop              | Type                                          | Default      | Description                                                        |
| ----------------- | --------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `axis`            | `'vertical' \| 'horizontal' \| 'both'`        | `'vertical'` | Which axis may scroll.                                             |
| `size`            | `number`                                      | `6`          | Thumb/track thickness in px.                                      |
| `radius`          | `number`                                      | `size / 2`   | Thumb corner radius in px.                                        |
| `theme`           | `'auto' \| 'dark' \| 'light' \| 'neutral'`    | `'auto'`     | Colour preset (see [Theming](#theming)).                          |
| `thumbColor`      | `string`                                      | theme value  | Override the thumb colour.                                        |
| `thumbHoverColor` | `string`                                      | theme value  | Override the thumb hover colour.                                  |
| `trackColor`      | `string`                                      | `transparent`| Override the track colour.                                        |
| `autoHide`        | `boolean`                                     | `false`      | Reveal the thumb only on hover / while scrolling (webkit).        |
| `autoHideDelay`   | `number`                                      | `1000`       | ms the thumb stays after scrolling stops.                        |
| `firefoxWidth`    | `'auto' \| 'thin' \| 'none'`                  | `'thin'`     | Firefox `scrollbar-width` keyword.                               |

### Exports

- `Scrollbar`, `GlobalScrollbar`
- `injectGlobalScrollbarStyles(options)` → cleanup fn
- `buildGlobalScrollbarCss(options)` → CSS string (for SSR / manual `<style>`)
- `ensureScrollbarStyles()`, `resolveColors(theme, overrides)`, `scrollbarCss`, `SCROLLBAR_CLASS`
- Types: `ScrollbarProps`, `ScrollbarAxis`, `ScrollbarTheme`, `ScrollbarColors`, `ScrollbarStyleOptions`, `FirefoxScrollbarWidth`, `GlobalScrollbarOptions`

## Theming

Colours are driven by CSS custom properties, so you can theme with props **or** with plain CSS.

- **`theme="auto"` (default)** — uses the CSS [`light-dark()`](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark) function and matches whereq.cc exactly on both schemes. For it to adapt, declare a `color-scheme` on your page (e.g. `:root { color-scheme: light dark }`). If none is declared it falls back to the light value.
- **`theme="dark" | "light"`** — explicit whereq.cc palette values.
- **`theme="neutral"`** — a translucent grey that's visible on any background, even without `color-scheme`.

Override individual tokens per instance:

```tsx
<Scrollbar thumbColor="rgba(23,162,174,.5)" thumbHoverColor="rgba(23,162,174,.8)" />
```

…or globally with CSS (the component reads these variables):

```css
.wq-scrollbar {
  --wq-sb-thumb: rgba(255, 255, 255, 0.1);
  --wq-sb-thumb-hover: rgba(255, 255, 255, 0.2);
  --wq-sb-size: 6px;
}
```

## Browser support

Native scrollbar styling: Chromium/Safari via `::-webkit-scrollbar`, Firefox via
`scrollbar-width` + `scrollbar-color`. `autoHide`'s per-state thumb reveal is a
webkit enhancement; Firefox shows the thin scrollbar consistently.

## Docs & playground

- 📖 **Docs** — https://whereq.github.io/whereq-react/
- 🧪 **Storybook** — https://whereq.github.io/whereq-react/storybook/ (`pnpm storybook` locally)
- 🖼️ A zero-build demo lives at [`examples/demo.html`](./examples/demo.html).

## Contributing & releasing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). We ship from a
`dev` → `main` → tag pipeline; see [RELEASING.md](./RELEASING.md). This is the first
component in WhereQ's frontend library; more primitives are on the way.

## License

[MIT](./LICENSE) © WhereQ
