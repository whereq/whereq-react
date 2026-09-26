---
'@whereq/react': minor
---

Add `CountryFlag` component.

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
