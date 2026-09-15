import type {
  GlobalScrollbarOptions,
  ScrollbarColors,
  ScrollbarStyleOptions,
  ScrollbarTheme,
} from './types'

/** Theme presets. `auto` reproduces the whereq.cc look on both colour schemes. */
const THEMES: Record<ScrollbarTheme, { thumb: string; thumbHover: string }> = {
  auto: {
    thumb: 'light-dark(rgba(0, 0, 0, 0.18), rgba(255, 255, 255, 0.1))',
    thumbHover: 'light-dark(rgba(0, 0, 0, 0.32), rgba(255, 255, 255, 0.2))',
  },
  dark: { thumb: 'rgba(255, 255, 255, 0.1)', thumbHover: 'rgba(255, 255, 255, 0.2)' },
  light: { thumb: 'rgba(0, 0, 0, 0.18)', thumbHover: 'rgba(0, 0, 0, 0.32)' },
  neutral: { thumb: 'rgba(128, 128, 128, 0.4)', thumbHover: 'rgba(128, 128, 128, 0.65)' },
}

/** Resolve the effective thumb colours from a theme + explicit overrides. */
export function resolveColors(
  theme: ScrollbarTheme = 'auto',
  { thumbColor, thumbHoverColor, trackColor }: ScrollbarColors = {},
): { thumb: string; thumbHover: string; track: string } {
  const preset = THEMES[theme] ?? THEMES.auto
  return {
    thumb: thumbColor ?? preset.thumb,
    thumbHover: thumbHoverColor ?? preset.thumbHover,
    track: trackColor ?? 'transparent',
  }
}

/** The CSS custom properties the base stylesheet reads, as a React style object. */
export function toCssVars(options: ScrollbarStyleOptions): Record<string, string> {
  const { size = 6, radius, theme = 'auto', firefoxWidth = 'thin' } = options
  const { thumb, thumbHover, track } = resolveColors(theme, options)
  return {
    '--wq-sb-size': `${size}px`,
    '--wq-sb-radius': `${radius ?? Math.round(size / 2)}px`,
    '--wq-sb-thumb': thumb,
    '--wq-sb-thumb-hover': thumbHover,
    '--wq-sb-track': track,
    '--wq-sb-ff': firefoxWidth,
  }
}

/** The class the {@link Scrollbar} component applies. */
export const SCROLLBAR_CLASS = 'wq-scrollbar'
export const AUTO_HIDE_CLASS = 'wq-scrollbar--auto-hide'

const STYLE_ID = 'wq-scrollbar-styles'

/**
 * The base stylesheet for {@link Scrollbar}. All colours/sizes are driven by the
 * `--wq-sb-*` custom properties the component sets inline, so this is injected
 * exactly once and never needs to change per instance.
 */
export const scrollbarCss = `
.${SCROLLBAR_CLASS} {
  scrollbar-width: var(--wq-sb-ff, thin);
  scrollbar-color: var(--wq-sb-thumb) var(--wq-sb-track);
}
.${SCROLLBAR_CLASS}::-webkit-scrollbar {
  width: var(--wq-sb-size, 6px);
  height: var(--wq-sb-size, 6px);
}
.${SCROLLBAR_CLASS}::-webkit-scrollbar-track {
  background: var(--wq-sb-track, transparent);
}
.${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb {
  background: var(--wq-sb-thumb);
  border-radius: var(--wq-sb-radius, 3px);
}
.${SCROLLBAR_CLASS}::-webkit-scrollbar-thumb:hover {
  background: var(--wq-sb-thumb-hover);
}
.${SCROLLBAR_CLASS}::-webkit-scrollbar-corner {
  background: var(--wq-sb-track, transparent);
}
.${AUTO_HIDE_CLASS}::-webkit-scrollbar-thumb {
  background: transparent;
  transition: background 0.2s ease;
}
.${AUTO_HIDE_CLASS}:hover::-webkit-scrollbar-thumb,
.${AUTO_HIDE_CLASS}[data-wq-scrolling='true']::-webkit-scrollbar-thumb {
  background: var(--wq-sb-thumb);
}
.${AUTO_HIDE_CLASS}:hover::-webkit-scrollbar-thumb:hover,
.${AUTO_HIDE_CLASS}[data-wq-scrolling='true']::-webkit-scrollbar-thumb:hover {
  background: var(--wq-sb-thumb-hover);
}
`.trim()

/** Inject the base {@link Scrollbar} stylesheet once. No-op on the server / repeat calls. */
export function ensureScrollbarStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = scrollbarCss
  document.head.appendChild(el)
}

/** Build the CSS string that styles native scrollbars for a given selector. */
export function buildGlobalScrollbarCss(options: GlobalScrollbarOptions = {}): string {
  const { selector = '*' } = options
  const { size = 6, radius, theme = 'auto', firefoxWidth = 'thin' } = options
  const { thumb, thumbHover, track } = resolveColors(theme, options)
  const r = radius ?? Math.round(size / 2)
  const sel = selector === '*' ? '*, *::before, *::after' : selector
  const wk = selector === '*' ? '' : `${selector} `
  return `
${sel} {
  scrollbar-width: ${firefoxWidth};
  scrollbar-color: ${thumb} ${track};
}
${wk}::-webkit-scrollbar { width: ${size}px; height: ${size}px; }
${wk}::-webkit-scrollbar-track { background: ${track}; }
${wk}::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: ${r}px; }
${wk}::-webkit-scrollbar-thumb:hover { background: ${thumbHover}; }
${wk}::-webkit-scrollbar-corner { background: ${track}; }
`.trim()
}

const GLOBAL_STYLE_ID = 'wq-scrollbar-global'

/**
 * Style every native scrollbar on the page (the whereq.cc app-wide look).
 * Idempotent — repeated calls replace the previous global stylesheet, so you can
 * re-invoke it to re-theme. Returns a cleanup function that removes the styles.
 */
export function injectGlobalScrollbarStyles(options: GlobalScrollbarOptions = {}): () => void {
  if (typeof document === 'undefined') return () => {}
  let el = document.getElementById(GLOBAL_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = GLOBAL_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = buildGlobalScrollbarCss(options)
  return () => {
    document.getElementById(GLOBAL_STYLE_ID)?.remove()
  }
}
