---
'@whereq/react': minor
---

Give the `SearchBox` the three hooks a consumer needs to adapt it.

- **`renderOption(suggestion, index, active)`** — draw a suggestion row
  yourself. The default stacks the label above the description; a consumer
  whose rows have their own shape (a leading badge, a name and a value on
  one line) draws them here.
- **`emptyText`** — say "nothing found" under the field when the query is
  not empty and nothing matched, instead of closing the dropdown.
- **`onClear`** — the clear (×) can do something other than empty the box.
  A consumer that keeps the typed query behind a picked result uses it to
  bring that query back.

Two more, small:

- Without an `onSubmit` the magnifier is **decoration** rather than a submit
  button: a search that runs as you type does not need one.
- The base stylesheet is now injected at the **front** of `<head>`, so an
  app's own stylesheet wins against a rule of the same specificity — a
  consumer can change any part of the box from plain CSS.

Plus `optionClassName` for extra classes on every suggestion row, and a
`font-size` on the row itself so a custom row inherits the theme's size.

6 new unit tests (100 in total).
