---
'@whereq/react': patch
---

Report the input's focus to the consumer.

`onFocus` and `onBlur` are forwarded to the input. A consumer whose box
shows a *picked* value needs them: focusing the box selects the text, so
the first keystroke replaces it instead of appending to it.
