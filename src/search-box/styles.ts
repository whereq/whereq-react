import type { SearchBoxTheme } from './types'

/** The class the {@link SearchBox} component applies to its root. */
export const SEARCH_BOX_CLASS = 'wq-search'
/** The class of the bordered input field. */
export const SEARCH_FIELD_CLASS = 'wq-search__field'
/** The class of the leading magnifier button. */
export const SEARCH_SUBMIT_CLASS = 'wq-search__submit'
/** The class of the text input. */
export const SEARCH_INPUT_CLASS = 'wq-search__input'
/** The class of the trailing clear (×) button. */
export const SEARCH_CLEAR_CLASS = 'wq-search__clear'
/** The class of the suggestion dropdown. */
export const SEARCH_LIST_CLASS = 'wq-search__list'
/** The class of one suggestion. */
export const SEARCH_OPTION_CLASS = 'wq-search__option'
/** The class of a suggestion's primary line. */
export const SEARCH_LABEL_CLASS = 'wq-search__label'
/** The class of a suggestion's secondary line. */
export const SEARCH_DESCRIPTION_CLASS = 'wq-search__description'
/** The class of the status line shown while loading. */
export const SEARCH_STATUS_CLASS = 'wq-search__status'

/**
 * The library's metroUI dark defaults — the whereq family look.
 *
 * Every value is also the fallback inside {@link searchBoxCss}, so a consumer
 * that never touches the `theme` prop still gets a coherent box, and one that
 * prefers CSS can override the `--wq-search-*` properties from a stylesheet
 * instead of the prop.
 */
export const DEFAULT_SEARCH_THEME: Required<SearchBoxTheme> = {
  fieldBg: '#1f2937',
  fieldBorder: '#374151',
  fieldBorderFocus: 'rgba(249, 115, 22, 0.6)',
  text: '#f0e6c8',
  placeholder: '#6b7280',
  icon: '#9ca3af',
  iconHover: '#f5a623',
  listBg: '#161b27',
  listBorder: '#374151',
  listText: '#f0e6c8',
  listDescription: '#8b949e',
  listActiveBg: '#1f2937',
  listActiveText: '#fdba74',
  radius: '4px',
  shadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
  font: 'inherit',
  fontSize: '13px',
}

/** Maps a theme key to the CSS custom property that carries it. */
const THEME_TO_VAR: Record<keyof SearchBoxTheme, string> = {
  fieldBg: '--wq-search-field-bg',
  fieldBorder: '--wq-search-field-border',
  fieldBorderFocus: '--wq-search-field-border-focus',
  text: '--wq-search-text',
  placeholder: '--wq-search-placeholder',
  icon: '--wq-search-icon',
  iconHover: '--wq-search-icon-hover',
  listBg: '--wq-search-list-bg',
  listBorder: '--wq-search-list-border',
  listText: '--wq-search-list-text',
  listDescription: '--wq-search-list-description',
  listActiveBg: '--wq-search-list-active-bg',
  listActiveText: '--wq-search-list-active-text',
  radius: '--wq-search-radius',
  shadow: '--wq-search-shadow',
  font: '--wq-search-font',
  fontSize: '--wq-search-font-size',
}

/**
 * The CSS custom properties for a theme, as a React style object.
 *
 * Only the tokens the caller actually set are emitted — the rest fall back to
 * the stylesheet's own defaults, so a stylesheet can still win for the tokens
 * the caller did not touch.
 */
export function toCssVars(theme: SearchBoxTheme = {}): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const key of Object.keys(THEME_TO_VAR) as Array<keyof SearchBoxTheme>) {
    const value = theme[key]
    if (value !== undefined) vars[THEME_TO_VAR[key]] = value
  }
  return vars
}

/**
 * The base stylesheet for {@link SearchBox}.
 *
 * Injected once. All colours and shapes read the `--wq-search-*` custom
 * properties, so per-instance theming is a matter of inline variables.
 */
export const searchBoxCss = `
.${SEARCH_BOX_CLASS} {
  position: relative;
  width: 100%;
  font-family: var(--wq-search-font, inherit);
}

.${SEARCH_FIELD_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--wq-search-field-bg, ${DEFAULT_SEARCH_THEME.fieldBg});
  border: 1px solid var(--wq-search-field-border, ${DEFAULT_SEARCH_THEME.fieldBorder});
  border-radius: var(--wq-search-radius, ${DEFAULT_SEARCH_THEME.radius});
  transition: border-color 0.15s ease;
}

.${SEARCH_FIELD_CLASS}:focus-within {
  border-color: var(--wq-search-field-border-focus, ${DEFAULT_SEARCH_THEME.fieldBorderFocus});
}

.${SEARCH_SUBMIT_CLASS} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--wq-search-icon, ${DEFAULT_SEARCH_THEME.icon});
  cursor: pointer;
  transition: color 0.15s ease;
}

.${SEARCH_SUBMIT_CLASS}:hover:not(:disabled) {
  color: var(--wq-search-icon-hover, ${DEFAULT_SEARCH_THEME.iconHover});
}

.${SEARCH_SUBMIT_CLASS}:disabled {
  cursor: default;
  opacity: 0.5;
}

.${SEARCH_INPUT_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--wq-search-text, ${DEFAULT_SEARCH_THEME.text});
  font-family: inherit;
  font-size: var(--wq-search-font-size, ${DEFAULT_SEARCH_THEME.fontSize});
  /* The whereq shell centres everything, and an input inherits it. */
  text-align: left;
  outline: none;
}

.${SEARCH_INPUT_CLASS}::placeholder {
  color: var(--wq-search-placeholder, ${DEFAULT_SEARCH_THEME.placeholder});
}

.${SEARCH_INPUT_CLASS}:disabled {
  cursor: default;
}

.${SEARCH_CLEAR_CLASS} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--wq-search-placeholder, ${DEFAULT_SEARCH_THEME.placeholder});
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease;
}

.${SEARCH_CLEAR_CLASS}:hover {
  color: var(--wq-search-text, ${DEFAULT_SEARCH_THEME.text});
}

.${SEARCH_LIST_CLASS} {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: var(--wq-search-list-z, 50);
  max-height: var(--wq-search-list-max-height, 288px);
  overflow-y: auto;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: var(--wq-search-list-bg, ${DEFAULT_SEARCH_THEME.listBg});
  border: 1px solid var(--wq-search-list-border, ${DEFAULT_SEARCH_THEME.listBorder});
  border-radius: var(--wq-search-radius, ${DEFAULT_SEARCH_THEME.radius});
  box-shadow: var(--wq-search-shadow, ${DEFAULT_SEARCH_THEME.shadow});
}

.${SEARCH_OPTION_CLASS} {
  display: block;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--wq-search-list-text, ${DEFAULT_SEARCH_THEME.listText});
  text-align: left;
}

.${SEARCH_OPTION_CLASS}:hover,
.${SEARCH_OPTION_CLASS}[data-active='true'] {
  background: var(--wq-search-list-active-bg, ${DEFAULT_SEARCH_THEME.listActiveBg});
}

.${SEARCH_OPTION_CLASS}[data-active='true'] .${SEARCH_LABEL_CLASS} {
  color: var(--wq-search-list-active-text, ${DEFAULT_SEARCH_THEME.listActiveText});
}

.${SEARCH_LABEL_CLASS} {
  display: block;
  font-size: var(--wq-search-font-size, ${DEFAULT_SEARCH_THEME.fontSize});
}

.${SEARCH_DESCRIPTION_CLASS} {
  display: block;
  font-size: 12px;
  color: var(--wq-search-list-description, ${DEFAULT_SEARCH_THEME.listDescription});
}

.${SEARCH_STATUS_CLASS} {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: var(--wq-search-list-z, 50);
  margin: 4px 0 0;
  padding: 8px 12px;
  background: var(--wq-search-list-bg, ${DEFAULT_SEARCH_THEME.listBg});
  border: 1px solid var(--wq-search-list-border, ${DEFAULT_SEARCH_THEME.listBorder});
  border-radius: var(--wq-search-radius, ${DEFAULT_SEARCH_THEME.radius});
  box-shadow: var(--wq-search-shadow, ${DEFAULT_SEARCH_THEME.shadow});
  color: var(--wq-search-list-description, ${DEFAULT_SEARCH_THEME.listDescription});
  font-size: 12px;
  text-align: left;
}
`.trim()

const STYLE_ID = 'wq-search-box-styles'

/** Inject the base {@link SearchBox} stylesheet once. No-op on the server / repeat calls. */
export function ensureSearchBoxStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = searchBoxCss
  document.head.appendChild(el)
}
