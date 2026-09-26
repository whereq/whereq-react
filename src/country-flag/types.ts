import type { HTMLAttributes, ReactElement, SVGProps } from 'react'

/** ISO 3166-1 alpha-2 country code (lowercase, e.g. `"us"`, `"cn"`), or one of the
 *  continent pseudo-codes `na` / `eu`. Lowercase so callers can use the same
 *  value they store everywhere else (region slugs, BCP-47 locale regions). */
export type CountrySlug = string

/** A flag builder — returns the inner SVG body for a given entry. */
export type FlagBuilder = () => ReactElement

/** One row in the flag registry: the human-readable name + the builder. */
export interface FlagEntry {
  /** ISO 3166-1 alpha-2 (lowercase) or continent pseudo-code. */
  slug: string
  /** Human-readable English name. */
  name: string
  /** Builder that returns the flag's inner SVG. */
  build: FlagBuilder
}

/** Display shape of the flag chip. Maps to the SVG's `border-radius`. */
export type CountryFlagShape = 'rect' | 'rounded' | 'circle'

/** `preserveAspectRatio` for the embedded flag SVG. Default `'xMidYMid meet'`
 *  (contain). `slice` covers the chip with the flag (cropped, no letterboxing). */
export type CountryFlagFit = 'contain' | 'slice'

/** Props for {@link CountryFlag}. */
export interface CountryFlagProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** ISO 3166-1 alpha-2 country code (`"us"`, `"cn"`, …) or continent (`"na"`, `"eu"`). */
  country: CountrySlug
  /** Diameter in px. Default `20`. */
  size?: number
  /** Display shape. Default `'rounded'`. */
  shape?: CountryFlagShape
  /** `preserveAspectRatio` strategy. Default `'contain'`. */
  fit?: CountryFlagFit
  /** Accessible label. Falls back to the human-readable country name (or the slug). */
  alt?: string
  /** SVG `<svg>` overrides. Spreads onto the inner `<svg>` after our defaults. */
  svgProps?: Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'xmlns' | 'role' | 'aria-label'>
}
