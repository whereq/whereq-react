import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

/** Avatar outline shape. */
export type AvatarShape = 'circle' | 'rounded' | 'square'

/** Presence status shown as a small corner dot. */
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

/** Props for the {@link Avatar} component. */
export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Image URL. If omitted — or it fails to load — initials (or `fallback`) show instead. */
  src?: string
  /** Person/entity name. Drives auto-initials, the deterministic colour and the a11y label. */
  name?: string
  /** Explicit initials. Overrides the value derived from `name`. */
  initials?: string
  /** Node rendered when there is no image and no initials (e.g. an icon). */
  fallback?: ReactNode
  /** Diameter in px. Default `40`. */
  size?: number
  /** Outline shape. Default `'circle'`. */
  shape?: AvatarShape
  /** Chip background (behind transparent art / initials). Default: derived from `name`. */
  bg?: string
  /** Initials colour. Default `'#fff'`. */
  color?: string
  /** Ring colour drawn as an inset border. Omit for none. */
  ring?: string
  /** Ring width in px. Default `1`. */
  ringWidth?: number
  /** `object-fit` for the image. Default `'cover'`. */
  fit?: CSSProperties['objectFit']
  /** `object-position` for the image. Default `'center'`; use `'top'` to head-crop portraits. */
  position?: CSSProperties['objectPosition']
  /** Presence status dot. Omit for none. */
  status?: AvatarStatus
  /** Per-status dot colour overrides. */
  statusColors?: Partial<Record<AvatarStatus, string>>
  /** Separator ring drawn around the status dot. Default `'#fff'`. */
  statusRing?: string
  /** Image `alt`. Falls back to `name`. */
  alt?: string
}

/** Props for the {@link AvatarGroup} component. */
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Diameter applied to every child avatar in px. Default `40`. */
  size?: number
  /** Max avatars to show before collapsing the rest into a `+N` chip. */
  max?: number
  /** Overlap between adjacent avatars in px. Default `size * 0.35`. */
  spacing?: number
  /** Ring drawn around each avatar to separate the overlap. Default `'#fff'`. */
  ring?: string
  /** Ring width in px. Default `2`. */
  ringWidth?: number
  /** Outline shape applied to every child avatar. Default `'circle'`. */
  shape?: AvatarShape
}
