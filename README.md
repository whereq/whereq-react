<div align="center">

# @whereq/react

**WhereQ's open-source React component library.**
Lightweight, accessible, themeable UI primitives — a thin **Scrollbar**, a generic **Avatar**, an inline-SVG **CountryFlag**, a multi-variant **Tag**, and a portal-style **Toast**.

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
- 🔔 **Toasts included** — built-in ToastProvider + imperative `toast.error("…")` API with 4 variants and 6 positions.
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

### `<Avatar>` — image, with a graceful initials fallback

```tsx
import { Avatar, AvatarGroup } from '@whereq/react'

// Image; falls back to initials on a name-derived colour if it 404s.
;<Avatar src="/users/ada.jpg" name="Ada Lovelace" status="online" />

// No image → deterministic initials chip.
;<Avatar name="Grace Hopper" />

// Head-crop a portrait so the face fills the circle, with a ring.
;<Avatar src="/mascot.png" name="Q" position="top" ring="#e4e8ee" ringWidth={2} />

// Overlapping stack with a +N overflow chip.
;<AvatarGroup size={32} max={3}>
  <Avatar src="/a.jpg" name="Ada" />
  <Avatar src="/b.jpg" name="Ben" />
  <Avatar name="Cai" />
  <Avatar name="Dee" />
</AvatarGroup>
```

### `<SearchBox>` — a search field with a suggestion dropdown

The component owns everything that is *not* domain logic: the field, the magnifier
(submit), the clear button, the dropdown, the keyboard navigation, the ARIA wiring
and the click-outside behaviour. The caller supplies the data and the two callbacks
that mean something to the domain — so a map place picker, a people picker and a
command palette all render the same box.

```tsx
import { SearchBox } from '@whereq/react'

;<SearchBox
  value={query}
  onChange={setQuery}
  loading={loading}
  suggestions={suggestions} // [{ key, label, description }]
  onSelect={(s) => pick(s)} // a suggestion was chosen
  onSubmit={(text) => search(text)} // free text was submitted
/>
```

Keyboard: `↑` / `↓` move the highlight (wrapping), `Enter` picks the highlighted
suggestion — or submits the text when nothing is highlighted — and `Escape` closes
the list.

Three small hooks let a consumer adapt the box without giving up the parts that
are easy to get wrong:

- **`renderOption`** — draw the row yourself (a leading badge, a name and a
  value on one line). The default stacks the label above the description.
- **`emptyText`** — say "nothing found" instead of closing the dropdown.
- **`onClear`** — the clear (×) can do something else than empty the box; a
  consumer that keeps the typed query behind a picked result uses it to bring
  that query back.

Without an `onSubmit` the magnifier is decoration rather than a submit button —
a search that runs as you type does not need one.

The base stylesheet is injected at the **front** of `<head>`, so an app's own
stylesheet wins against a rule of the same specificity: a consumer can change
any part of the box from plain CSS.

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

### `<Avatar>` props

Extends `React.HTMLAttributes<HTMLSpanElement>` (minus `color`). Full table in the
[Avatar docs](https://whereq.github.io/whereq-react/components/avatar).

| Prop        | Type                                        | Default    | Description                                              |
| ----------- | ------------------------------------------- | ---------- | ------------------------------------------------------- |
| `src`       | `string`                                    | —          | Image URL; falls back to initials if missing / errors.  |
| `name`      | `string`                                    | —          | Drives auto-initials, the colour and the a11y label.    |
| `size`      | `number`                                    | `40`       | Diameter in px.                                         |
| `shape`     | `'circle' \| 'rounded' \| 'square'`         | `'circle'` | Outline shape.                                          |
| `position`  | `CSSProperties['objectPosition']`           | `'center'` | Image `object-position` — use `'top'` to head-crop.     |
| `ring`      | `string`                                    | —          | Inset ring colour (`ringWidth` px, default `1`).        |
| `status`    | `'online' \| 'offline' \| 'busy' \| 'away'` | —          | Presence dot in the corner.                            |

`<AvatarGroup>` overlaps children (`size`, `max`, `spacing`, `ring`, `shape`).

### `<SearchBox>` props

Extends `React.HTMLAttributes<HTMLDivElement>` (minus `children`, `onChange`,
`onSubmit` and `onSelect`, which the component owns).

| Prop                | Type                                                   | Default            | Description                                                   |
| ------------------- | ------------------------------------------------------ | ------------------ | ------------------------------------------------------------- |
| `value`             | `string`                                               | —                  | The current text in the box.                                   |
| `onChange`          | `(value: string) => void`                              | —                  | Called on every keystroke and on clear.                        |
| `suggestions`       | `SearchBoxSuggestion[]`                                | `[]`               | `{ key, label, description? }` — an empty list hides the list. |
| `onSelect`          | `(suggestion, index) => void`                          | —                  | A suggestion was picked (click or Enter).                      |
| `onSubmit`          | `(value: string) => void`                              | —                  | The text was submitted and no suggestion was picked.            |
| `onClear`           | `() => void`                                           | —                  | Called by the clear (×) instead of clearing the value.         |
| `renderOption`      | `(suggestion, index, active) => ReactNode`             | —                  | Draws one suggestion row yourself.                              |
| `emptyText`         | `string`                                               | —                  | Shown when the query is not empty and nothing matched.         |
| `loading`           | `boolean`                                              | `false`            | Shows the "Searching…" status line.                            |
| `loadingText`       | `string`                                               | `'Searching…'`     | The status line's text.                                        |
| `placeholder`       | `string`                                               | `'Search'`         | Placeholder text.                                               |
| `label`             | `string`                                               | `placeholder`      | Accessible name of the input.                                  |
| `submitLabel`       | `string`                                               | `'Search'`         | Accessible name of the magnifier.                               |
| `clearLabel`        | `string`                                               | `'Clear search'`   | Accessible name of the clear button.                           |
| `disabled`          | `boolean`                                              | `false`            | Disables the whole box.                                         |
| `clearable`         | `boolean`                                              | `true`             | Shows the clear (×) button while there is text.                |
| `showSubmit`        | `boolean`                                              | `true`             | Shows the leading magnifier.                                    |
| `submitBehavior`    | `'select-then-submit' \| 'always-submit'`              | `'select-then-submit'` | What Enter / the magnifier does.                           |
| `onHighlightChange` | `(index: number) => void`                              | —                  | Fired when the keyboard highlight moves.                       |
| `theme`             | `SearchBoxTheme`                                       | —                  | Colour + shape tokens (see [Theming](#theming)).               |
| `inputId`           | `string`                                               | generated          | The input's id; also seeds the listbox id.                     |
| `inputClassName`    | `string`                                               | —                  | Extra classes for the input.                                   |
| `listClassName`     | `string`                                               | —                  | Extra classes for the suggestion list.                         |
| `optionClassName`   | `string`                                               | —                  | Extra classes for each suggestion row.                         |
| `onFocus`          | `FocusEventHandler<HTMLInputElement>`                   | —                  | Fired when the input is focused.                                |
| `onBlur`           | `FocusEventHandler<HTMLInputElement>`                   | —                  | Fired when the input loses focus.                               |
| `inputRef`          | `Ref<HTMLInputElement>`                                | —                  | Ref to the input element.                                      |

### Exports

- `Scrollbar`, `GlobalScrollbar`
- `injectGlobalScrollbarStyles(options)` → cleanup fn
- `buildGlobalScrollbarCss(options)` → CSS string (for SSR / manual `<style>`)
- `ensureScrollbarStyles()`, `resolveColors(theme, overrides)`, `scrollbarCss`, `SCROLLBAR_CLASS`
- `Avatar`, `AvatarGroup`
- `initialsFromName(name, max?)`, `colorFromName(name, palette?)`, `radiusFor(shape, size)`, `AVATAR_PALETTE`, `STATUS_COLORS`
- `CountryFlag` — props: `country` (ISO 3166-1 alpha-2), `size`, `shape`, `fit`, `className`, `alt`
- `lookupFlag(slug)`, `isSupported(slug)`, `FLAG_CATALOG`, `SUPPORTED_SLUGS`, `FLAG_VIEWBOX`, `star5(cx, cy, r)`
- `Tag`, `TagImpl<T>` — props: `variant` (subtle/solid/dot/link), `size` (sm/md), `as` (span/a/button/div), `solidColor`, `dotColor`, `className`, `children`
- `tagClasses(variant?, size?, dotColor?, solidColor?)` — pure helper
- `toast` (imperative handle), `ToastProvider`, `ToastViewport`, `useToast` / `useToastContext`
- `SearchBox` — props: `value`, `onChange`, `suggestions`, `onSelect`, `onSubmit`, `loading`, `loadingText`, `placeholder`, `label`, `submitLabel`, `clearLabel`, `disabled`, `clearable`, `showSubmit`, `submitBehavior`, `onHighlightChange`, `theme`, `inputId`, `inputClassName`, `listClassName`, `inputRef`
- `ensureSearchBoxStyles()`, `searchBoxCss`, `toCssVars(theme)`, `DEFAULT_SEARCH_THEME`, `SEARCH_BOX_CLASS` and the `SEARCH_*_CLASS` constants
- Types: `ScrollbarProps`, `ScrollbarAxis`, `ScrollbarTheme`, `ScrollbarColors`, `ScrollbarStyleOptions`, `FirefoxScrollbarWidth`, `GlobalScrollbarOptions`, `AvatarProps`, `AvatarGroupProps`, `AvatarShape`, `AvatarStatus`, `CountryFlagProps`, `CountryFlagShape`, `CountryFlagFit`, `CountrySlug`, `TagProps`, `TagPropsDefault`, `TagVariant`, `TagSize`, `TagAs`, `ToastApi`, `ToastItem`, `ToastOptions`, `ToastPosition`, `ToastVariant`, `ToastViewportProps`, `ToastContextValue`, `SearchBoxProps`, `SearchBoxSuggestion`, `SearchBoxTheme`, `SearchBoxSubmitBehavior`

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

`<SearchBox>` is themed the same way — through the `--wq-search-*` custom
properties (`--wq-search-field-bg`, `--wq-search-field-border`,
`--wq-search-field-border-focus`, `--wq-search-text`, `--wq-search-placeholder`,
`--wq-search-icon`, `--wq-search-icon-hover`, `--wq-search-list-bg`,
`--wq-search-list-border`, `--wq-search-list-text`,
`--wq-search-list-description`, `--wq-search-list-active-bg`,
`--wq-search-list-active-text`, `--wq-search-radius`, `--wq-search-shadow`,
`--wq-search-font`, `--wq-search-font-size`). Set them with the `theme` prop or
straight from CSS:

```tsx
<SearchBox theme={{ fieldBg: '#0f172a', listActiveText: '#38bdf8' }} … />
```

```css
.wq-search {
  --wq-search-field-bg: #0f172a;
  --wq-search-list-active-text: #38bdf8;
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
