import { forwardRef, createElement } from 'react'
import type { ReactElement, Ref } from 'react'
import type { TagProps, TagPropsDefault, TagSize, TagVariant, TagAs } from './types'

/** A generic inline tag / chip / pill.
 *
 *  Replaces the 6+ ad-hoc `<span className="rounded-full border…">` patterns
 *  scattered across the portal with one consistent component. Variants:
 *
 *  - `subtle` (default) — outlined, dim text. The most common — used for
 *    dataset cadences, access labels, and the "Public · daily" pills.
 *  - `solid` — filled with a subtle background. Good for selected / active
 *    states (e.g. active tab on the domain-browse page).
 *  - `dot` — leading dot + label. Used for region tags on hot-list cards
 *    and status indicators.
 *  - `link` — hover-able outlined chip that reads as a clickable navigation
 *    element (e.g. the "← Back to Finance" return chip on detail pages).
 *
 *  Forwards a ref to the rendered element. Pure inline styles, SSR-safe,
 *  no DOM access, no JS, no stylesheet injection.
 *
 *  @example
 *  ```tsx
 *  <Tag>Public · daily</Tag>
 *  <Tag variant="solid">Active</Tag>
 *  <Tag variant="dot" dotColor="var(--up)">Operational</Tag>
 *  <Tag variant="link" as="a" href="/domains/finance">← Back to Finance</Tag>
 *  ```
 */
/** Implementation: a plain function component (not `forwardRef`) so we can
 *  make the prop type generic in `as` without TS fighting the ref forward.
 *  The named export below wraps this in a `forwardRef` for ergonomic `ref`
 *  support at the call site. */
export function TagImpl<T extends TagAs = 'span'>(
  { variant = 'subtle', size = 'sm', as, dotColor, className, children, ref, ...rest }: TagProps<T>,
): ReactElement {
  const tag = (as ?? 'span') as TagAs
  return createElement(
    tag,
    {
      ...rest,
      // Ref is typed by the caller via TagAs. We can't know the element's
      // precise HTMLElement subtype at this call site, so `any` is the
      // standard escape hatch for polymorphic forwardRef. The public API
      // is typed correctly for each `as` value (see types.ts).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref: ref as Ref<any>,
      className: [
        'inline-flex items-center gap-1.5 whitespace-nowrap',
        sizeClasses(size),
        variantClasses(variant, dotColor),
        className,
      ].filter(Boolean).join(' '),
    },
    variant === 'dot' && createElement('span', {
      'aria-hidden': true,
      className: 'h-1.5 w-1.5 shrink-0 rounded-full',
      style: dotColor ? { backgroundColor: dotColor } : undefined,
    }),
    children,
  )
}

/** Public API: a `forwardRef`-wrapped Tag with the most common default
 *  (span). Use the raw {@link TagImpl} if you need a specific `as` type. */
export const Tag = forwardRef<HTMLElement, TagPropsDefault>(function Tag(props, ref) {
  // The generic T isn't preserved through forwardRef's type-erasing indirection,
  // so we cast at the boundary. The variant 'as' prop is still typed correctly
  // when callers explicitly use TagProps<T> + TagImpl.
  return <TagImpl {...(props as TagPropsDefault)} ref={ref as Ref<HTMLElement>} />
})

// ── Style tables (pure functions so tests can cover them) ─────────────────────

function sizeClasses(size: TagSize): string {
  return size === 'md'
    ? 'px-3 py-1 text-sm'
    : 'px-2 py-0.5 text-[10px] uppercase tracking-wide'
}

function variantClasses(variant: TagVariant, dotColor?: string): string {
  switch (variant) {
    case 'subtle':
      // xs radius (2px) — matches the rest of the whereq family (metroUI
      // style). The two pill variants (solid, link) keep rounded-full.
      return 'rounded border border-[var(--rule)] text-[var(--text-faint)]'
    case 'solid':
      return 'rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]'
    case 'dot':
      // The dot itself carries the colour; the pill stays neutral.
      return 'rounded border border-[var(--rule)] text-[var(--text-dim)]' + (dotColor ? '' : ' [&]:before:hidden')
    case 'link':
      return 'rounded-full border border-[var(--rule)] text-[var(--text-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]'
  }
}

// Variant helper exported for tests + consumers that need a single class.
export function tagClasses(
  variant: TagVariant = 'subtle',
  size: TagSize = 'sm',
  dotColor?: string,
): string {
  return `${sizeClasses(size)} ${variantClasses(variant, dotColor)}`
}
