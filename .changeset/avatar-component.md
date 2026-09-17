---
'@whereq/react': minor
---

Add `Avatar` and `AvatarGroup` components.

`Avatar` is a generic, accessible avatar chip: it renders an image and gracefully
falls back to name-derived initials (on a deterministic colour) or a custom node
when the image is missing or fails to load. It supports `circle` / `rounded` /
`square` shapes, an inset `ring`, a presence `status` dot, and head-cropping of
portraits via `position="top"`. `AvatarGroup` overlaps avatars with a `+N`
overflow chip. The initials/colour helpers (`initialsFromName`, `colorFromName`)
are exported too. SSR-safe with no stylesheet injection.
