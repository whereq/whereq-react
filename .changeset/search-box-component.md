---
'@whereq/react': minor
---

Add a generic, themeable `SearchBox` component (6th component in the lib).

The component owns everything that is *not* domain logic: the field, the
leading magnifier (which submits), the trailing clear (×), the suggestion
dropdown, the keyboard navigation (↑ / ↓ wrap, Enter picks the highlighted
suggestion, Escape closes), the ARIA wiring (`combobox` / `listbox` /
`option`, `aria-activedescendant`) and the click-outside behaviour. The
caller supplies only the data and the two callbacks that mean something to
the domain — `onSelect(suggestion, index)` and `onSubmit(text)`.

That split is what makes it reusable across the whereq universe: a map
place picker, a people picker and a command palette all render the same box
and differ only in what they do with the result.

Theming runs through the `--wq-search-*` CSS custom properties, exactly like
`Scrollbar`: the base stylesheet is injected once (`ensureSearchBoxStyles`),
the `theme` prop sets the tokens inline, and a consumer that prefers CSS can
set the same properties in a stylesheet instead. The default tokens are the
whereq metroUI dark palette.

Includes 21 unit tests (rendering, the ARIA wiring, highlight movement and
wrapping, pick on click and on Enter, submit on Enter with no highlight, the
`always-submit` mode, clear, Escape, click-outside, the loading status line,
the theme tokens, single stylesheet injection and the controlled-box case).
