---
'@whereq/react': patch
---

Align default radii to the metroUI "xs" (2px) on CountryFlag and Tag's `subtle` + `dot` variants.

- `CountryFlag`: `shape="rounded"` (the default) is now 2px (was 4px), matching the rest of the whereq family. `rect` and `circle` unchanged.
- `Tag`: `subtle` and `dot` variants use `rounded` (xs) instead of `rounded-full`, so default badges sit flush with the rest of the metroUI surface. `solid` and `link` keep `rounded-full` (intentional pills).
