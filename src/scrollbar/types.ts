import type { HTMLAttributes } from 'react'

/** Which axis (or axes) the scroll container may overflow on. */
export type ScrollbarAxis = 'vertical' | 'horizontal' | 'both'

/**
 * Colour theme for the thumb/track.
 *
 * - `auto` — uses the CSS `light-dark()` function so the scrollbar adapts to the
 *   element's `color-scheme` (the exact whereq.cc look on both light and dark).
 * - `dark` / `light` — explicit whereq.cc palette values.
 * - `neutral` — a semi-transparent grey that is visible on any background,
 *   even when the page has not declared a `color-scheme`.
 */
export type ScrollbarTheme = 'auto' | 'dark' | 'light' | 'neutral'

/** Firefox `scrollbar-width` keyword. Webkit width is controlled by `size`. */
export type FirefoxScrollbarWidth = 'auto' | 'thin' | 'none'

/** Colour tokens shared by the component props and the global styler. */
export interface ScrollbarColors {
  /** Base thumb colour. Defaults to the resolved `theme` value. */
  thumbColor?: string
  /** Thumb colour on hover. Defaults to the resolved `theme` value. */
  thumbHoverColor?: string
  /** Track (gutter) colour. Defaults to `transparent`. */
  trackColor?: string
}

/** Shared visual options (used by `Scrollbar` and `injectGlobalScrollbarStyles`). */
export interface ScrollbarStyleOptions extends ScrollbarColors {
  /** Thumb/track thickness in px. Default `6`. */
  size?: number
  /** Thumb corner radius in px. Default `Math.round(size / 2)`. */
  radius?: number
  /** Colour theme preset. Default `auto`. */
  theme?: ScrollbarTheme
  /** Firefox scrollbar width keyword. Default `thin`. */
  firefoxWidth?: FirefoxScrollbarWidth
}

/** Props for the {@link Scrollbar} scroll-container component. */
export interface ScrollbarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'color'>,
    ScrollbarStyleOptions {
  /** Axis (or axes) the content may scroll on. Default `vertical`. */
  axis?: ScrollbarAxis
  /**
   * Hide the thumb until the user hovers the area or is actively scrolling.
   * Full support on webkit browsers; on Firefox the thin scrollbar stays visible.
   * Default `false`.
   */
  autoHide?: boolean
  /** How long (ms) the thumb stays visible after scrolling stops. Default `1000`. */
  autoHideDelay?: number
}

/** Options for {@link injectGlobalScrollbarStyles} / {@link GlobalScrollbar}. */
export interface GlobalScrollbarOptions extends ScrollbarStyleOptions {
  /**
   * CSS selector the styles target. Default `'*'` — i.e. every native scrollbar
   * on the page (the whereq.cc app-wide look). Pass e.g. `'html'` or a custom
   * selector to scope it.
   */
  selector?: string
}
