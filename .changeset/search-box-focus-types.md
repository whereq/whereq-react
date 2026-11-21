---
'@whereq/react': patch
---

Fix the `SearchBox` props type: `onFocus` and `onBlur` must reach the
**input**, not the root element.

`SearchBoxProps` extends the root element's `HTMLAttributes`, which already
carries `onFocus` / `onBlur` for the wrapper. The inherited members won, so a
consumer's `onFocus` handler was typed as a `<div>` handler and
`currentTarget.select()` did not typecheck. Both are now omitted from the
inherited set, so the handlers are the input's.
