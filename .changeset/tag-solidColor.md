---
'@whereq/react': patch
---

`Tag`: add a `solidColor` prop to the `solid` variant. Defaults to the
design token `"accent"`. Accepts one of the existing CSS variables
(`"accent"`, `"up"`, `"down"`, `"nova"`) or a raw CSS colour value. Lets
callers reuse the `solid` "filled coloured pill" look with arbitrary
colours — e.g. a green "Live" indicator (`solidColor="up"`) without
writing a new variant. New test coverage + Storybook story included.
