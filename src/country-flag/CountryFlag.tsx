import { forwardRef, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { FLAG_VIEWBOX, lookupFlag } from './flags'
import type { CountryFlagProps } from './types'

/** Maps {@link CountryFlagShape} to a CSS `border-radius`. */
const RADIUS: Record<NonNullable<CountryFlagProps['shape']>, string> = {
  rect: '2px',
  rounded: '4px',
  circle: '50%',
}

/**
 * An inline-SVG country flag chip that renders identically everywhere — no
 * emoji or system-font dependency, so the chip is the same on a Windows
 * screenshot, a Linux server, a watchOS widget, or a print stylesheet.
 *
 * The flag set covers the world's major economies and the two continent
 * pseudo-codes (`na` / `eu`); the registry is hand-curated and easy to extend
 * (see `flags.ts`). Unknown slugs fall through to the continent emblem so the
 * chip never renders empty — better than a missing-image glyph.
 *
 * For an unknown slug, you can also pass a custom `alt` so screen readers get
 * something meaningful instead of the raw code.
 *
 * @example
 * ```tsx
 * <CountryFlag country="us" />
 * <CountryFlag country="cn" size={28} shape="circle" />
 * <CountryFlag country="eu" alt="European Union" />
 * ```
 */
export const CountryFlag = forwardRef<HTMLSpanElement, CountryFlagProps>(function CountryFlag(
  {
    country,
    size = 20,
    shape = 'rounded',
    fit = 'contain',
    alt,
    className,
    style,
    svgProps,
    ...rest
  },
  ref,
) {
  const slug = country.toLowerCase()
  const entry = useMemo(() => lookupFlag(slug), [slug])
  // Even when the slug is unknown, we render a neutral fallback glyph (the
  // continent emblem) — a missing flag is more useful than an empty box.
  const label = alt ?? entry?.name ?? country.toUpperCase()
  const inner = useMemo(() => (entry ? entry.build() : null), [entry])

  const wrapStyle: CSSProperties = {
    display: 'inline-block',
    flex: '0 0 auto',
    width: size,
    height: Math.round(size * (16 / 24)),
    lineHeight: 0,
    verticalAlign: 'middle',
    userSelect: 'none',
    borderRadius: RADIUS[shape],
    overflow: 'hidden',
    background: 'transparent',
    ...style,
  }
  const par = fit === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet'

  return (
    <span
      {...rest}
      ref={ref}
      className={className}
      style={wrapStyle}
      // The <svg> inside is the labelled image for screen readers; the wrapper
      // is purely decorative. See WCAG 1.1.1 / ARIA img-role guidance.
      role="img"
      aria-label={label}
    >
      {inner ? (
        <svg
          {...svgProps}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={FLAG_VIEWBOX}
          width={size}
          height={Math.round(size * (16 / 24))}
          preserveAspectRatio={par}
          focusable="false"
          aria-hidden="true"
        >
          {inner}
        </svg>
      ) : null}
    </span>
  )
})
