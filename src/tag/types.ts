import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, Ref, ReactNode } from 'react'

/** Visual style for a <Tag>. */
export type TagVariant = 'subtle' | 'solid' | 'dot' | 'link'

/** Size step. `sm` is the default — matches the most common portal usage
 *  (10–11px text on dataset cadences / access labels). */
export type TagSize = 'sm' | 'md'

/** Render the tag as this element. Default `'span'`. */
export type TagAs = 'span' | 'a' | 'button' | 'div'

/** Type-mapped HTML attributes: anchor tags get `href`/anchor attributes,
 *  button tags get button attributes, span/div get the generic HTMLAttributes
 *  subset. This way `<Tag as="a" href="...">` typechecks but
 *  `<Tag as="button" href="...">` does not. We omit `children` and
 *  add `ref` so the prop bag matches what the component actually takes. */
type TagPropsByAs = {
  span: Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'ref'> & { ref?: Ref<HTMLElement> }
  div: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'ref'> & { ref?: Ref<HTMLElement> }
  a: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'ref'> & { ref?: Ref<HTMLElement> }
  button: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'ref'> & { ref?: Ref<HTMLElement> }
}

/** Props for {@link Tag}, narrowed to the element chosen via `as`.
 *
 *  Generic typed: `TagProps<'span'>` (default), `TagProps<'a'>`, `TagProps<'button'>`.
 *  When you set `as="a"`, `href` becomes a valid prop; when you set
 *  `as="button"`, `onClick` becomes valid; etc. The default no-`as` use of
 *  `<Tag>...</Tag>` is still `TagProps<'span'>` for backwards compat. */
export type TagProps<T extends TagAs = 'span'> = Omit<TagPropsByAs[T], 'children'> & {
  /** Variant controls the visual style. Default `'subtle'`. */
  variant?: TagVariant
  /** Size step. Default `'sm'`. */
  size?: TagSize
  /** The label rendered inside the tag. */
  children: ReactNode
  /** Optional leading dot colour (used with `variant="dot"`). */
  dotColor?: string
  /** Render as this element. Default `'span'`. */
  as?: T
}

/** Convenience default — most call sites don't need to be generic. */
export type TagPropsDefault = TagProps<'span'>
