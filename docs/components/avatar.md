# Avatar

A generic, accessible avatar chip. It renders an image when you give it one, and
gracefully falls back to **name-derived initials** (on a deterministic colour) or a
custom node when the image is missing or fails to load — so a list never shows a
broken-image icon.

> 🧪 Try every prop live in the [Storybook](/storybook/).

## Usage

```tsx
import { Avatar } from '@whereq/react'

;<Avatar src="/users/ada.jpg" name="Ada Lovelace" />
```

Initials fallback (no `src`, or the image 404s) — the background colour is derived
deterministically from `name`:

```tsx
<Avatar name="Grace Hopper" /> // → "GH" on a stable colour
```

Head-crop a portrait so the face fills the circle, with a ring:

```tsx
<Avatar src="/mascot.png" name="Q" position="top" ring="#e4e8ee" ringWidth={2} />
```

Shapes and a presence dot:

```tsx
<Avatar name="Ada" shape="rounded" />
<Avatar src="/ada.jpg" name="Ada" status="online" />
```

## AvatarGroup

Overlap several avatars and collapse the overflow into a `+N` chip. Size, shape and
the separator ring are set once on the group and applied to every child.

```tsx
import { Avatar, AvatarGroup } from '@whereq/react'

;<AvatarGroup size={32} max={3}>
  <Avatar src="/a.jpg" name="Ada" />
  <Avatar src="/b.jpg" name="Ben" />
  <Avatar name="Cai" />
  <Avatar name="Dee" />
</AvatarGroup>
```

## Props

`<Avatar>` extends `React.HTMLAttributes<HTMLSpanElement>` (minus `color`) — `className`,
`style`, `ref` and any other span prop pass through.

| Prop           | Type                                          | Default          | Description                                              |
| -------------- | --------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `src`          | `string`                                      | —                | Image URL. Falls back to initials if missing / errors.  |
| `name`         | `string`                                      | —                | Drives auto-initials, the colour and the a11y label.    |
| `initials`     | `string`                                      | from `name`      | Explicit initials override.                             |
| `fallback`     | `ReactNode`                                   | —                | Shown when there's no image and no initials (an icon).  |
| `size`         | `number`                                      | `40`             | Diameter in px.                                         |
| `shape`        | `'circle' \| 'rounded' \| 'square'`           | `'circle'`       | Outline shape.                                          |
| `bg`           | `string`                                      | from `name`      | Chip background (behind transparent art / initials).    |
| `color`        | `string`                                      | `'#fff'`         | Initials colour.                                        |
| `ring`         | `string`                                      | —                | Inset ring colour.                                     |
| `ringWidth`    | `number`                                      | `1`              | Ring width in px.                                       |
| `fit`          | `CSSProperties['objectFit']`                  | `'cover'`        | Image `object-fit`.                                    |
| `position`     | `CSSProperties['objectPosition']`             | `'center'`       | Image `object-position` — use `'top'` to head-crop.     |
| `status`       | `'online' \| 'offline' \| 'busy' \| 'away'`   | —                | Presence dot in the corner.                            |
| `statusColors` | `Partial<Record<AvatarStatus, string>>`       | preset           | Per-status dot colour overrides.                       |
| `statusRing`   | `string`                                      | `'#fff'`         | Separator ring around the status dot.                  |
| `alt`          | `string`                                      | `name`           | Image alt text.                                        |

### `<AvatarGroup>` props

Extends `React.HTMLAttributes<HTMLDivElement>`.

| Prop        | Type                                | Default        | Description                                     |
| ----------- | ----------------------------------- | -------------- | ----------------------------------------------- |
| `size`      | `number`                            | `40`           | Diameter applied to every child.               |
| `max`       | `number`                            | —              | Show this many, then a `+N` chip.              |
| `spacing`   | `number`                            | `size * 0.35`  | Overlap between adjacent avatars in px.        |
| `ring`      | `string`                            | `'#fff'`       | Separator ring around each avatar.             |
| `ringWidth` | `number`                            | `2`            | Ring width in px.                              |
| `shape`     | `'circle' \| 'rounded' \| 'square'` | `'circle'`     | Outline shape applied to every child.          |

## Helpers

The pure functions behind the component are exported for reuse:

```ts
import { initialsFromName, colorFromName } from '@whereq/react'

initialsFromName('Ada Lovelace') // 'AL'
initialsFromName('张伟') // '张伟'
colorFromName('Ada Lovelace') // a stable palette hex
```

## Notes

- **Accessibility** — when an image is shown, the `<img>` carries the `alt`; otherwise
  the wrapper is exposed as `role="img"` with `aria-label={name}`, and the initials are
  `aria-hidden`.
- **SSR-safe** — the component is pure inline styles with no stylesheet injection or
  DOM access, so it renders identically on the server and hydrates cleanly.
- **Image errors** — a failed load flips to the initials/fallback, and the state resets
  automatically when `src` changes (safe for reused list rows).
