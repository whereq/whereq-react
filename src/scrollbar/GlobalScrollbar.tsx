import { useInsertionEffect } from 'react'
import { injectGlobalScrollbarStyles } from './styles'
import type { GlobalScrollbarOptions } from './types'

/**
 * Applies whereq.cc's thin scrollbar to **every native scrollbar on the page**
 * (or a custom `selector`). Renders nothing — mount it once near the root.
 *
 * @example
 * ```tsx
 * // Style the whole app's scrollbars, adapting to light/dark automatically.
 * <GlobalScrollbar theme="auto" size={6} />
 * ```
 */
export function GlobalScrollbar(props: GlobalScrollbarOptions): null {
  const { selector, size, radius, theme, thumbColor, thumbHoverColor, trackColor, firefoxWidth } =
    props
  useInsertionEffect(() => {
    return injectGlobalScrollbarStyles({
      selector,
      size,
      radius,
      theme,
      thumbColor,
      thumbHoverColor,
      trackColor,
      firefoxWidth,
    })
  }, [selector, size, radius, theme, thumbColor, thumbHoverColor, trackColor, firefoxWidth])

  return null
}
