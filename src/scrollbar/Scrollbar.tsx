import { forwardRef, useCallback, useInsertionEffect, useRef } from 'react'
import type { CSSProperties, UIEvent } from 'react'
import { AUTO_HIDE_CLASS, SCROLLBAR_CLASS, ensureScrollbarStyles, toCssVars } from './styles'
import type { ScrollbarAxis, ScrollbarProps } from './types'

function overflowFor(axis: ScrollbarAxis): CSSProperties {
  switch (axis) {
    case 'both':
      return { overflow: 'auto' }
    case 'horizontal':
      return { overflowX: 'auto', overflowY: 'hidden' }
    case 'vertical':
    default:
      return { overflowY: 'auto', overflowX: 'hidden' }
  }
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * A scroll container with whereq.cc's thin, themeable scrollbar.
 *
 * It styles the **native** scrollbar (no scroll hijacking), so keyboard, wheel,
 * touch and accessibility all keep working. Colours and size are driven by CSS
 * custom properties set inline, and the tiny base stylesheet is injected once.
 *
 * @example
 * ```tsx
 * <Scrollbar style={{ maxHeight: 320 }}>
 *   <LongList />
 * </Scrollbar>
 * ```
 */
export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(function Scrollbar(
  {
    size,
    radius,
    theme,
    thumbColor,
    thumbHoverColor,
    trackColor,
    firefoxWidth,
    axis = 'vertical',
    autoHide = false,
    autoHideDelay = 1000,
    className,
    style,
    onScroll,
    children,
    ...rest
  },
  ref,
) {
  // useInsertionEffect is the React-recommended place to inject styles; it runs
  // before the browser paints, avoiding a flash of the default scrollbar.
  useInsertionEffect(() => {
    ensureScrollbarStyles()
  }, [])

  const nodeRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (autoHide && nodeRef.current) {
        const el = nodeRef.current
        el.setAttribute('data-wq-scrolling', 'true')
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
          el.removeAttribute('data-wq-scrolling')
        }, autoHideDelay)
      }
      onScroll?.(event)
    },
    [autoHide, autoHideDelay, onScroll],
  )

  const cssVars = toCssVars({ size, radius, theme, thumbColor, thumbHoverColor, trackColor, firefoxWidth })

  return (
    <div
      {...rest}
      ref={setRefs}
      className={cx(SCROLLBAR_CLASS, autoHide && AUTO_HIDE_CLASS, className)}
      style={{ ...overflowFor(axis), ...(cssVars as CSSProperties), ...style }}
      onScroll={handleScroll}
    >
      {children}
    </div>
  )
})
