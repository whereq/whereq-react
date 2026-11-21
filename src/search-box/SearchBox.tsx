'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import {
  SEARCH_BOX_CLASS,
  SEARCH_CLEAR_CLASS,
  SEARCH_DESCRIPTION_CLASS,
  SEARCH_FIELD_CLASS,
  SEARCH_INPUT_CLASS,
  SEARCH_LABEL_CLASS,
  SEARCH_LIST_CLASS,
  SEARCH_OPTION_CLASS,
  SEARCH_STATUS_CLASS,
  SEARCH_SUBMIT_CLASS,
  ensureSearchBoxStyles,
  toCssVars,
} from './styles'
import type { SearchBoxProps, SearchBoxSuggestion } from './types'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** The magnifier that submits the search. */
function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

/**
 * A generic, themeable search box with a suggestion dropdown.
 *
 * The component owns everything that is *not* domain logic: the field, the
 * magnifier, the clear button, the dropdown, the keyboard navigation, the
 * ARIA wiring and the click-outside behaviour. The caller supplies the data
 * (`suggestions`), the text (`value` / `onChange`) and the two callbacks that
 * mean something to the domain (`onSelect`, `onSubmit`).
 *
 * That split is what makes it reusable across the whereq universe: a map
 * place picker, a people picker and a command palette all render the same box
 * and differ only in what they do with the result.
 *
 * Theming runs through the `--wq-search-*` CSS custom properties. The base
 * stylesheet is injected once; the `theme` prop sets the tokens inline, and a
 * consumer that prefers CSS can set the same properties in a stylesheet
 * instead.
 *
 * @example
 * ```tsx
 * <SearchBox
 *   value={query}
 *   onChange={setQuery}
 *   loading={loading}
 *   suggestions={suggestions}
 *   onSelect={(s) => pick(s)}
 *   onSubmit={(text) => search(text)}
 * />
 * ```
 */
export const SearchBox = forwardRef<HTMLDivElement, SearchBoxProps>(function SearchBox(
  {
    value,
    onChange,
    suggestions = [],
    onSelect,
    onSubmit,
    loading = false,
    loadingText = 'Searching…',
    placeholder = 'Search',
    label,
    submitLabel = 'Search',
    clearLabel = 'Clear search',
    disabled = false,
    clearable = true,
    showSubmit = true,
    submitBehavior = 'select-then-submit',
    onHighlightChange,
    theme,
    inputId,
    inputClassName,
    listClassName,
    inputRef,
    className,
    style,
    ...rest
  },
  ref,
) {
  // useInsertionEffect is the React-recommended place to inject styles; it runs
  // before the browser paints, so the box never flashes unstyled.
  useInsertionEffect(() => {
    ensureSearchBoxStyles()
  }, [])

  const reactId = useId()
  const id = inputId ?? `wq-search-${reactId.replace(/:/g, '')}`
  const listId = `${id}-listbox`

  const rootRef = useRef<HTMLDivElement | null>(null)
  const localInputRef = useRef<HTMLInputElement | null>(null)

  // The latest suggestions, for the handlers below. A ref keeps them out of
  // the dependency lists without making the handlers stale.
  const suggestionsRef = useRef<SearchBoxSuggestion[]>(suggestions)
  suggestionsRef.current = suggestions

  /** A stable key for the current result set — same results, same signature. */
  const signature = useMemo(() => suggestions.map((s) => s.key).join('\u0000'), [suggestions])

  const [highlighted, setHighlighted] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  // Adjust the state when the result set changes: the first suggestion takes
  // the highlight, and a fresh result set re-opens a list the user dismissed.
  // A new *query* on its own does not re-open it — the results have to arrive
  // first, otherwise the list would flash back open with stale suggestions.
  const [lastSignature, setLastSignature] = useState(signature)
  if (signature !== lastSignature) {
    setLastSignature(signature)
    setHighlighted(0)
    setDismissed(false)
  }

  const activeIndex = suggestions.length > 0 ? highlighted : -1
  const isOpen = suggestions.length > 0 && !dismissed

  useEffect(() => {
    onHighlightChange?.(activeIndex)
  }, [activeIndex, onHighlightChange])

  // Close the list when the user clicks somewhere else.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDismissed(true)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      localInputRef.current = node
      if (typeof inputRef === 'function') inputRef(node)
      else if (inputRef) (inputRef as { current: HTMLInputElement | null }).current = node
    },
    [inputRef],
  )

  /** Pick a suggestion and hand it to the caller. */
  const pick = useCallback(
    (index: number) => {
      const suggestion = suggestionsRef.current[index]
      if (!suggestion) return
      setDismissed(true)
      setHighlighted(0)
      onSelect?.(suggestion, index)
    },
    [onSelect],
  )

  /** Submit whatever is in the box: a suggestion if one is highlighted, the text otherwise. */
  const submit = useCallback(() => {
    const current = suggestionsRef.current
    if (submitBehavior === 'always-submit') {
      const text = value.trim()
      if (text) onSubmit?.(text)
      return
    }
    if (current.length > 0 && highlighted >= 0) {
      pick(highlighted)
      return
    }
    const text = value.trim()
    if (!text) return
    onSubmit?.(text)
  }, [highlighted, onSubmit, pick, submitBehavior, value])

  /** Empty the box. */
  const clear = useCallback(() => {
    onChange('')
    localInputRef.current?.focus()
  }, [onChange])

  /** Move the keyboard highlight, wrapping around at both ends. */
  const moveHighlight = useCallback((delta: number) => {
    setHighlighted((current) => {
      const count = suggestionsRef.current.length
      if (count === 0) return 0
      const next = current + delta
      if (next < 0) return count - 1
      if (next >= count) return 0
      return next
    })
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setDismissed(false)
          moveHighlight(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          setDismissed(false)
          moveHighlight(-1)
          break
        case 'Enter':
          event.preventDefault()
          submit()
          break
        case 'Escape':
          event.preventDefault()
          setDismissed(true)
          break
        default:
          break
      }
    },
    [moveHighlight, submit],
  )

  const handleOptionMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLLIElement>, index: number) => {
      // Keep the input focused, then pick the suggestion.
      event.preventDefault()
      pick(index)
    },
    [pick],
  )

  const cssVars = toCssVars(theme)

  return (
    <div
      {...rest}
      ref={(node: HTMLDivElement | null) => {
        rootRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as { current: HTMLDivElement | null }).current = node
      }}
      className={cx(SEARCH_BOX_CLASS, className)}
      style={{ ...(cssVars as CSSProperties), ...style }}
    >
      <div className={SEARCH_FIELD_CLASS}>
        {showSubmit && (
          <button
            type="button"
            onClick={submit}
            aria-label={submitLabel}
            title={submitLabel}
            disabled={disabled}
            className={SEARCH_SUBMIT_CLASS}
          >
            <SearchIcon />
          </button>
        )}
        <input
          id={id}
          ref={setRefs}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={label ?? placeholder}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          placeholder={placeholder}
          disabled={disabled}
          className={cx(SEARCH_INPUT_CLASS, inputClassName)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {clearable && value && (
          <button
            type="button"
            onClick={clear}
            aria-label={clearLabel}
            title={clearLabel}
            disabled={disabled}
            className={SEARCH_CLEAR_CLASS}
          >
            &times;
          </button>
        )}
      </div>

      {isOpen && (
        <ul id={listId} role="listbox" className={cx(SEARCH_LIST_CLASS, listClassName)}>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.key}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              className={SEARCH_OPTION_CLASS}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(event) => handleOptionMouseDown(event, index)}
            >
              <span className={SEARCH_LABEL_CLASS}>{suggestion.label}</span>
              {suggestion.description && (
                <span className={SEARCH_DESCRIPTION_CLASS}>{suggestion.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {loading && <div className={SEARCH_STATUS_CLASS}>{loadingText}</div>}
    </div>
  )
})
