# @whereq/react

## 0.10.0

### Minor Changes

- 6a22756: Twenty more country flags, and two that were only half-drawn.

  **New countries** — Pakistan, Singapore, Algeria, Morocco, Kuwait, Qatar,
  Kenya, Kazakhstan, Croatia, Czechia, Chile, Uruguay, Bangladesh, Sri Lanka,
  Ukraine, Colombia, Ecuador, Peru, Nigeria and Bulgaria. The registry now
  knows 65 countries.

  **India and South Korea** get their emblems: the Ashoka chakra and the
  taegeuk with its four trigrams, instead of a bare tricolor and a plain
  two-tone disc.

  **Saudi Arabia** no longer draws the letters "SA" on green — it gets the
  script and the sword, as far as they survive at chip size.

  Every new flag was drawn against a reference image and checked side by side
  before it was committed: the crescent of Pakistan opens up and to the right,
  Qatar's white band is at the hoist, and Kuwait's black trapezoid has its
  base on the hoist edge.

  **`in2` and `nl2`** were duplicates of countries that already had a key of
  their own. They now resolve as aliases — the registry keeps one row per
  country, and both spellings still render the right flag.

## 0.9.5

### Patch Changes

- fda5f39: Fix the United Kingdom flag: `country="gb"` now renders the Union Jack.

  The registry keyed the United Kingdom under `uk`, but ISO 3166-1 alpha-2
  says `gb` — so the lookup missed and the chip rendered **empty** (an
  unknown slug draws nothing). `gb` is now the registry key and `uk` stays
  as an alias, so both spellings render the flag.

  The same change makes an unknown slug draw the neutral continent emblem
  instead of nothing, which is what the docs have always promised — a chip
  is never an empty box now.

## 0.9.4

### Patch Changes

- 8554f76: Paint the `solid` variant of `Tag` inline as well as with classes.

  Its colour classes are built at runtime (`bg-[${colour}]/10`), and a
  consumer's Tailwind only ever sees the template literal in the published
  bundle — so it cannot compile them and the pill renders **unpainted** in
  every Tailwind app. The solid variant now applies its colour, background
  and border inline (with `color-mix()` for the tints), which paints the
  pill everywhere. The class names stay, so a consumer that compiles them
  gets the same result.

## 0.9.3

### Patch Changes

- b042a0f: Paint the toast's tinted background and border with `color-mix()`.

  `var(--up)/10` is not valid CSS — the slash-alpha form only exists inside a
  colour function, so the browser dropped the whole declaration. A success,
  warning or error toast therefore rendered with **no background and no border**,
  only coloured text. The tints are now `color-mix(in oklab, var(--up) 10%,
transparent)` and the border uses the 30% mix.

  Also fixes the `solid` variant of `Tag`: the border colour went through the
  bare `border <colour>/30` form, which is two class names and not a utility, so
  the pill drew a border in the wrong colour. It is now the arbitrary-value form
  `border-[<colour>]/30`.

## 0.9.2

### Patch Changes

- 5d492fe: Fix the `SearchBox` props type: `onFocus` and `onBlur` must reach the
  **input**, not the root element.

  `SearchBoxProps` extends the root element's `HTMLAttributes`, which already
  carries `onFocus` / `onBlur` for the wrapper. The inherited members won, so a
  consumer's `onFocus` handler was typed as a `<div>` handler and
  `currentTarget.select()` did not typecheck. Both are now omitted from the
  inherited set, so the handlers are the input's.

## 0.9.1

### Patch Changes

- fd4afdc: Report the input's focus to the consumer.

  `onFocus` and `onBlur` are forwarded to the input. A consumer whose box
  shows a _picked_ value needs them: focusing the box selects the text, so
  the first keystroke replaces it instead of appending to it.

## 0.9.0

### Minor Changes

- b5460a5: Give the `SearchBox` the three hooks a consumer needs to adapt it.

  - **`renderOption(suggestion, index, active)`** — draw a suggestion row
    yourself. The default stacks the label above the description; a consumer
    whose rows have their own shape (a leading badge, a name and a value on
    one line) draws them here.
  - **`emptyText`** — say "nothing found" under the field when the query is
    not empty and nothing matched, instead of closing the dropdown.
  - **`onClear`** — the clear (×) can do something other than empty the box.
    A consumer that keeps the typed query behind a picked result uses it to
    bring that query back.

  Two more, small:

  - Without an `onSubmit` the magnifier is **decoration** rather than a submit
    button: a search that runs as you type does not need one.
  - The base stylesheet is now injected at the **front** of `<head>`, so an
    app's own stylesheet wins against a rule of the same specificity — a
    consumer can change any part of the box from plain CSS.

  Plus `optionClassName` for extra classes on every suggestion row, and a
  `font-size` on the row itself so a custom row inherits the theme's size.

  6 new unit tests (100 in total).

## 0.8.0

### Minor Changes

- 7cfa6eb: Add a generic, themeable `SearchBox` component (6th component in the lib).

  The component owns everything that is _not_ domain logic: the field, the
  leading magnifier (which submits), the trailing clear (×), the suggestion
  dropdown, the keyboard navigation (↑ / ↓ wrap, Enter picks the highlighted
  suggestion, Escape closes), the ARIA wiring (`combobox` / `listbox` /
  `option`, `aria-activedescendant`) and the click-outside behaviour. The
  caller supplies only the data and the two callbacks that mean something to
  the domain — `onSelect(suggestion, index)` and `onSubmit(text)`.

  That split is what makes it reusable across the whereq universe: a map
  place picker, a people picker and a command palette all render the same box
  and differ only in what they do with the result.

  Theming runs through the `--wq-search-*` CSS custom properties, exactly like
  `Scrollbar`: the base stylesheet is injected once (`ensureSearchBoxStyles`),
  the `theme` prop sets the tokens inline, and a consumer that prefers CSS can
  set the same properties in a stylesheet instead. The default tokens are the
  whereq metroUI dark palette.

  Includes 21 unit tests (rendering, the ARIA wiring, highlight movement and
  wrapping, pick on click and on Enter, submit on Enter with no highlight, the
  `always-submit` mode, clear, Escape, click-outside, the loading status line,
  the theme tokens, single stylesheet injection and the controlled-box case).

### Patch Changes

- 7cfa6eb: The Toast component (added in 0.5.0 work on `feat/toast`) was missing
  from the main entry export. `src/index.ts` did not include `export * from
'./toast'`, so consumers who imported `import { ToastProvider, ToastViewport,
toast } from '@whereq/react'` got undefined.

  Fix: add the missing re-export. Verified by re-running the full test
  suite (73 tests) + a fresh build (ESM 33.62 KB, types 24.63 KB) which
  now exposes ToastProvider, ToastViewport, toast, useToast and the Toast*
  types at the package root.

  Also bumps the version to 0.7.1.

## 0.7.0

### Minor Changes

- 55375ff: Add `Toast` component (4th component in the lib).

  `ToastProvider` wraps your app and holds the queue. `ToastViewport`
  renders the queue at one of 6 positions (top-left/center/right,
  bottom-left/center/right). `toast.notify / .success / .warning / .error /
.info / .custom / .update / .dismiss / .clear / .items` is the
  imperative handle — works from anywhere (event handlers, async callbacks,
  non-React code). The imperative handle is a Proxy that always reads
  from the latest mounted api (no stale closure).

  Includes 12 unit tests (lifecycle, push/dismiss/update/clear, maxVisible,
  position assertions, accessibility role, xs-radius) and the metroUI xs
  2px radius. Default auto-dismiss is 4000ms; pause on hover + focus for
  a11y. Variants: default / success / warning / error.

## 0.6.0

### Minor Changes

- b5d4e12: Add `Toast` component (4th component in the lib).

  `ToastProvider` wraps your app and holds the queue. `ToastViewport`
  renders the queue at one of 6 positions (top-left/center/right,
  bottom-left/center/right). `toast.notify / .success / .warning / .error /
.info / .custom / .update / .dismiss / .clear / .items` is the
  imperative handle — works from anywhere (event handlers, async callbacks,
  non-React code). The imperative handle is a Proxy that always reads
  from the latest mounted api (no stale closure).

  Includes 12 unit tests (lifecycle, push/dismiss/update/clear, maxVisible,
  position assertions, accessibility role, xs-radius) and the metroUI xs
  2px radius. Default auto-dismiss is 4000ms; pause on hover + focus for
  a11y. Variants: default / success / warning / error.

## 0.4.2

### Patch Changes

- caf803d: `Scrollbar` + `Avatar` use the whereq family's metroUI "xs" radius (2px)
  by default, matching the rest of the whereq family surface.

  - `Scrollbar`: default `--wq-sb-radius` is now `2px` (was `size/2`,
    typically 4px). CSS `border-radius` fallback is now `2px` (was `3px`).
    Pass `radius` to override.
  - `Avatar`: `radiusFor('rounded', size)` returns `2px` (was
    `Math.max(2, size * 0.22)px`, up to 22% of the avatar dimension).
    `circle` and `square` are unchanged.

  Tests updated. Build succeeds.

- caf803d: `Tag`: add a `solidColor` prop to the `solid` variant. Defaults to the
  design token `"accent"`. Accepts one of the existing CSS variables
  (`"accent"`, `"up"`, `"down"`, `"nova"`) or a raw CSS colour value. Lets
  callers reuse the `solid` "filled coloured pill" look with arbitrary
  colours — e.g. a green "Live" indicator (`solidColor="up"`) without
  writing a new variant. New test coverage + Storybook story included.

## 0.4.1

### Patch Changes

- 02321cf: Align default radii to the metroUI "xs" (2px) on CountryFlag and Tag's `subtle` + `dot` variants.

  - `CountryFlag`: `shape="rounded"` (the default) is now 2px (was 4px), matching the rest of the whereq family. `rect` and `circle` unchanged.
  - `Tag`: `subtle` and `dot` variants use `rounded` (xs) instead of `rounded-full`, so default badges sit flush with the rest of the metroUI surface. `solid` and `link` keep `rounded-full` (intentional pills).

## 0.4.0

### Minor Changes

- dce8ac9: Add `Tag` component.

  A generic inline tag / chip / pill with four variants — `subtle` (outlined, dim
  text — the most common, used for "Public · daily" pills and category labels),
  `solid` (filled accent background, for selected/active states), `dot` (leading
  dot + label, for status indicators), `link` (hover-able outlined chip for
  clickable navigation). Size step `sm` (default, 10px uppercase) + `md` (13px
  sentence case).

  API: `<Tag>...</Tag>` for the default span element. `<TagImpl<T extends "span"
| "a" | "button" | "div"> as="..." ...>` for non-span uses — the generic
  type narrows the HTML props to the chosen element so `<TagImpl as="a"
href="...">` typechecks while `<TagImpl as="button" href="...">` does not.
  13 vitest unit tests + 7 Storybook stories cover all four variants, the size
  step, the `as` polymorphism, ref forwarding, and the edge cases.

## 0.3.0

### Minor Changes

- 55617a7: Add `CountryFlag` component.

  An inline-SVG country flag chip that renders identically on any device — no
  emoji or system-font dependency, so the chip looks the same on a Windows
  screenshot, a Linux server, a watchOS widget, or a print stylesheet. Shared
  flag registry covers 40+ major economies plus the `na` / `eu` continent
  pseudo-codes; unknown slugs fall through to a safe continent emblem. Composes
  from `verticalStripes` / `horizontalStripes` helpers for tricolors, hand-drawn
  inline SVG for flags with non-trivial geometry (US stars + canton, Union Jack,
  Nordic cross). SSR-safe, tree-shakeable, `forwardRef<HTMLSpanElement>`. Pure
  helpers (`lookupFlag`, `isSupported`, `FLAG_CATALOG`, `SUPPORTED_SLUGS`,
  `FLAG_VIEWBOX`, `star5`) are exported alongside the component.

## 0.2.0

### Minor Changes

- d7d51be: Add `Avatar` and `AvatarGroup` components.

  `Avatar` is a generic, accessible avatar chip: it renders an image and gracefully
  falls back to name-derived initials (on a deterministic colour) or a custom node
  when the image is missing or fails to load. It supports `circle` / `rounded` /
  `square` shapes, an inset `ring`, a presence `status` dot, and head-cropping of
  portraits via `position="top"`. `AvatarGroup` overlaps avatars with a `+N`
  overflow chip. The initials/colour helpers (`initialsFromName`, `colorFromName`)
  are exported too. SSR-safe with no stylesheet injection.

## 0.1.0

### Minor Changes

- Initial release. `Scrollbar` and `GlobalScrollbar` — whereq.cc's thin, themeable,
  accessible native scrollbar as reusable React components. Ships ESM + CJS + types
  with a `"use client"` boundary for Next.js App Router.
