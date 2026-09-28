# @whereq/react

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
