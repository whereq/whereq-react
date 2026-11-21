import type { FocusEventHandler, HTMLAttributes, ReactNode, Ref } from 'react'

/** One entry in the suggestion list. */
export interface SearchBoxSuggestion {
  /** Stable key — used for React reconciliation and for the option id. */
  key: string
  /** The primary line ("Banff"). */
  label: ReactNode
  /** The secondary, disambiguating line ("Alberta, Canada"). */
  description?: ReactNode
}

/**
 * Colour + shape tokens for the search box.
 *
 * Every token maps to a `--wq-search-*` CSS custom property, so it can be
 * set from the `theme` prop (inline style) or straight from a stylesheet.
 * Unset tokens fall back to the library's metroUI dark defaults.
 */
export interface SearchBoxTheme {
  /** Background of the input field. */
  fieldBg?: string
  /** Border of the input field. */
  fieldBorder?: string
  /** Border of the input field while it has focus. */
  fieldBorderFocus?: string
  /** Colour of the typed text. */
  text?: string
  /** Colour of the placeholder text. */
  placeholder?: string
  /** Colour of the leading magnifier. */
  icon?: string
  /** Colour of the leading magnifier on hover. */
  iconHover?: string
  /** Background of the suggestion list. */
  listBg?: string
  /** Border of the suggestion list. */
  listBorder?: string
  /** Colour of a suggestion's primary line. */
  listText?: string
  /** Colour of a suggestion's secondary line. */
  listDescription?: string
  /** Background of the highlighted suggestion. */
  listActiveBg?: string
  /** Colour of the highlighted suggestion's primary line. */
  listActiveText?: string
  /** Corner radius of the field and the list. */
  radius?: string
  /** Drop shadow of the suggestion list. */
  shadow?: string
  /** Font stack of the field and the list. */
  font?: string
  /** Font size of the typed text. */
  fontSize?: string
}

/**
 * What Enter (and the magnifier) does.
 *
 * - `select-then-submit` (default) — a highlighted suggestion wins; with no
 *   suggestion highlighted the typed text is submitted.
 * - `always-submit` — the typed text is always submitted, even when a
 *   suggestion is highlighted.
 */
export type SearchBoxSubmitBehavior = 'select-then-submit' | 'always-submit'

/** Props for the {@link SearchBox} component. */
export interface SearchBoxProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'onSubmit' | 'onSelect'> {
  /** The current text in the box. */
  value: string
  /** Called on every keystroke (and on clear) with the new text. */
  onChange: (value: string) => void
  /** The suggestions to show under the field. An empty list hides the dropdown. */
  suggestions?: SearchBoxSuggestion[]
  /** Called when a suggestion is picked (click or Enter). */
  onSelect?: (suggestion: SearchBoxSuggestion, index: number) => void
  /** Called when the text is submitted and no suggestion was picked. */
  onSubmit?: (value: string) => void
  /**
   * Called by the clear (×) button instead of clearing the value.
   *
   * A consumer that keeps the typed query behind a picked result wants the ×
   * to bring that query back rather than empty the box.
   */
  onClear?: () => void
  /**
   * Renders one suggestion row.
   *
   * The default draws the label above the description. A consumer whose rows
   * have their own shape — a leading badge, a name and a value on one line —
   * draws them here instead.
   */
  renderOption?: (suggestion: SearchBoxSuggestion, index: number, active: boolean) => ReactNode
  /**
   * Shown under the field when the query is not empty and nothing matched.
   * Without it, an empty result set simply closes the dropdown.
   */
  emptyText?: string
  /** Shows the "Searching…" status line under the field. */
  loading?: boolean
  /** The status line shown while `loading`. Default `'Searching…'`. */
  loadingText?: string
  /** The placeholder. Default `'Search'`. */
  placeholder?: string
  /** Accessible name of the input. Defaults to `placeholder`. */
  label?: string
  /** Accessible name of the magnifier button. Default `'Search'`. */
  submitLabel?: string
  /** Accessible name of the clear button. Default `'Clear search'`. */
  clearLabel?: string
  /** Disables the whole box. */
  disabled?: boolean
  /** Shows the clear (×) button while there is text. Default `true`. */
  clearable?: boolean
  /** Shows the leading magnifier. Default `true`. */
  showSubmit?: boolean
  /** What Enter / the magnifier does. Default `'select-then-submit'`. */
  submitBehavior?: SearchBoxSubmitBehavior
  /** Called whenever the keyboard highlight moves. */
  onHighlightChange?: (index: number) => void
  /** Colour + shape tokens. See {@link SearchBoxTheme}. */
  theme?: SearchBoxTheme
  /** The id of the input element. Also seeds the listbox id. */
  inputId?: string
  /** Extra classes for the input element. */
  inputClassName?: string
  /** Extra classes for the suggestion list. */
  listClassName?: string
  /** Extra classes for each suggestion row. */
  optionClassName?: string
  /** Ref to the input element. */
  inputRef?: Ref<HTMLInputElement>
  /**
   * Called when the input is focused.
   *
   * A consumer whose box shows a *picked* value focuses it to select the
   * text, so the first keystroke replaces it instead of appending to it.
   */
  onFocus?: FocusEventHandler<HTMLInputElement>
  /** Called when the input loses focus. */
  onBlur?: FocusEventHandler<HTMLInputElement>
}
