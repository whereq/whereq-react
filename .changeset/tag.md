---
'@whereq/react': minor
---

Add `Tag` component.

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
