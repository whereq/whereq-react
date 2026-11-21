---
'@whereq/react': patch
---

Paint the `solid` variant of `Tag` inline as well as with classes.

Its colour classes are built at runtime (`bg-[${colour}]/10`), and a
consumer's Tailwind only ever sees the template literal in the published
bundle — so it cannot compile them and the pill renders **unpainted** in
every Tailwind app. The solid variant now applies its colour, background
and border inline (with `color-mix()` for the tints), which paints the
pill everywhere. The class names stay, so a consumer that compiles them
gets the same result.
