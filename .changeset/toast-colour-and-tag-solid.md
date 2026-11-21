---
'@whereq/react': patch
---

Paint the toast's tinted background and border with `color-mix()`.

`var(--up)/10` is not valid CSS — the slash-alpha form only exists inside a
colour function, so the browser dropped the whole declaration. A success,
warning or error toast therefore rendered with **no background and no border**,
only coloured text. The tints are now `color-mix(in oklab, var(--up) 10%,
transparent)` and the border uses the 30% mix.

Also fixes the `solid` variant of `Tag`: the border colour went through the
bare `border <colour>/30` form, which is two class names and not a utility, so
the pill drew a border in the wrong colour. It is now the arbitrary-value form
`border-[<colour>]/30`.
