---
'@whereq/react': patch
---

`Scrollbar` + `Avatar` use the whereq family's metroUI "xs" radius (2px)
by default, matching the rest of the whereq family surface.

- `Scrollbar`: default `--wq-sb-radius` is now `2px` (was `size/2`,
  typically 4px). CSS `border-radius` fallback is now `2px` (was `3px`).
  Pass `radius` to override.
- `Avatar`: `radiusFor('rounded', size)` returns `2px` (was
  `Math.max(2, size * 0.22)px`, up to 22% of the avatar dimension).
  `circle` and `square` are unchanged.

Tests updated. Build succeeds.
