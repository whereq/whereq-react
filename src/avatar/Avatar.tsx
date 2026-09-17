import { forwardRef, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { STATUS_COLORS, colorFromName, initialsFromName, radiusFor } from './styles'
import type { AvatarProps } from './types'

/**
 * A generic, accessible avatar chip.
 *
 * Renders an image when `src` is given, and gracefully falls back to
 * name-derived initials (on a deterministic colour) or a custom `fallback`
 * node when the image is missing or fails to load. Portrait art can be
 * head-cropped with `position="top"`, and an optional presence `status` dot is
 * drawn in the corner. It styles a plain `<span>`, so it works anywhere and
 * needs no stylesheet.
 *
 * @example
 * ```tsx
 * <Avatar src="/u/ada.jpg" name="Ada Lovelace" size={40} />
 * <Avatar name="Grace Hopper" status="online" />          // initials fallback
 * <Avatar src="/mascot.png" name="Q" position="top" ring="#e4e8ee" />
 * ```
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    src,
    name,
    initials,
    fallback,
    size = 40,
    shape = 'circle',
    bg,
    color = '#fff',
    ring,
    ringWidth = 1,
    fit = 'cover',
    position = 'center',
    status,
    statusColors,
    statusRing = '#fff',
    alt,
    className,
    style,
    ...rest
  },
  ref,
) {
  const [failed, setFailed] = useState(false)
  // Retry when the source changes (e.g. a list row is reused for a new person).
  useEffect(() => setFailed(false), [src])

  const showImage = Boolean(src) && !failed
  const text = initials ?? initialsFromName(name)
  const radius = radiusFor(shape, size)
  const chipBg = bg ?? (showImage ? 'transparent' : colorFromName(name))
  const label = alt ?? name

  const clipStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
    background: chipBg,
    color,
    overflow: 'hidden',
    fontSize: Math.round(size * 0.4),
    fontWeight: 600,
    lineHeight: 1,
    boxShadow: ring ? `inset 0 0 0 ${ringWidth}px ${ring}` : undefined,
  }

  const dotSize = Math.max(8, Math.round(size * 0.28))
  const dotColor = status ? (statusColors?.[status] ?? STATUS_COLORS[status]) : undefined

  return (
    <span
      {...rest}
      ref={ref}
      className={className}
      // When an <img> is present it carries the alt text; otherwise the wrapper
      // is the labelled image for screen readers.
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : label}
      style={{
        position: 'relative',
        display: 'inline-block',
        flex: '0 0 auto',
        width: size,
        height: size,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={clipStyle}>
        {showImage ? (
          <img
            src={src}
            alt={label ?? ''}
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position, display: 'block' }}
          />
        ) : text ? (
          <span aria-hidden="true">{text}</span>
        ) : (
          fallback
        )}
      </span>

      {status && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 2px ${statusRing}`,
          }}
        />
      )}
    </span>
  )
})
