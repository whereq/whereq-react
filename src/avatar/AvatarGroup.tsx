import { Children, cloneElement, forwardRef, isValidElement } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { Avatar } from './Avatar'
import type { AvatarGroupProps, AvatarProps } from './types'

/**
 * A row of overlapping {@link Avatar}s with an optional `+N` overflow chip.
 *
 * Size, shape and the separator ring are applied to every child, so you only
 * set them once on the group. The leftmost avatar stacks on top.
 *
 * @example
 * ```tsx
 * <AvatarGroup size={32} max={3}>
 *   <Avatar src="/a.jpg" name="Ada" />
 *   <Avatar src="/b.jpg" name="Ben" />
 *   <Avatar name="Cai" />
 *   <Avatar name="Dee" />
 * </AvatarGroup>
 * ```
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { size = 40, max, spacing, ring = '#fff', ringWidth = 2, shape = 'circle', className, style, children, ...rest },
  ref,
) {
  const overlap = spacing ?? Math.round(size * 0.35)
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[]
  const shown = typeof max === 'number' ? items.slice(0, max) : items
  const hidden = items.length - shown.length

  const stack = (i: number, extra?: CSSProperties): CSSProperties => ({
    marginLeft: i === 0 ? 0 : -overlap,
    position: 'relative',
    zIndex: items.length - i,
    ...extra,
  })

  return (
    <div
      {...rest}
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {shown.map((child, i) =>
        cloneElement(child, {
          key: child.key ?? i,
          size,
          shape,
          ring,
          ringWidth,
          style: { ...stack(i), ...child.props.style },
        }),
      )}
      {hidden > 0 && (
        <Avatar
          size={size}
          shape={shape}
          ring={ring}
          ringWidth={ringWidth}
          initials={`+${hidden}`}
          name={`+${hidden} more`}
          bg="#5C6B7A"
          style={stack(shown.length)}
        />
      )}
    </div>
  )
})
