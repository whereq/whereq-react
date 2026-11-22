---
'@whereq/react': patch
---

Fix the United Kingdom flag: `country="gb"` now renders the Union Jack.

The registry keyed the United Kingdom under `uk`, but ISO 3166-1 alpha-2
says `gb` — so the lookup missed and the chip rendered **empty** (an
unknown slug draws nothing). `gb` is now the registry key and `uk` stays
as an alias, so both spellings render the flag.

The same change makes an unknown slug draw the neutral continent emblem
instead of nothing, which is what the docs have always promised — a chip
is never an empty box now.
