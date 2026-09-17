import type { AvatarShape, AvatarStatus } from './types'

/**
 * Default palette for name-derived background colours. Mid-tone, saturated hues
 * that read well behind white initials on both light and dark surfaces.
 */
export const AVATAR_PALETTE = [
  '#E8590C', // orange
  '#1C7ED6', // blue
  '#2F9E44', // green
  '#9C36B5', // grape
  '#E03131', // red
  '#0CA678', // teal
  '#F08C00', // amber
  '#4263EB', // indigo
  '#C2255C', // pink
  '#5C7CFA', // periwinkle
  '#1098AD', // cyan
  '#495057', // slate
] as const

/** Default presence dot colours. */
export const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: '#2E9E6B',
  offline: '#9AA7B4',
  busy: '#D64545',
  away: '#F5A623',
}

/**
 * Derive up to `max` initials from a name.
 *
 * - `"Ada Lovelace"` → `"AL"`
 * - `"cher"` → `"CH"` (single word: first `max` letters)
 * - `"张伟"` → `"张伟"` (CJK: first `max` characters)
 */
export function initialsFromName(name?: string, max = 2): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return ''
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return [...(parts[0] ?? '')].slice(0, max).join('').toUpperCase()
  }
  return parts
    .slice(0, max)
    .map((p) => [...p][0] ?? '')
    .join('')
    .toUpperCase()
}

/** Deterministically pick a palette colour from a name (stable across renders). */
export function colorFromName(name = '', palette: readonly string[] = AVATAR_PALETTE): string {
  if (palette.length === 0) return '#495057'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length] ?? palette[0] ?? '#495057'
}

/** Resolve the CSS `border-radius` for a given shape + size. */
export function radiusFor(shape: AvatarShape, size: number): string {
  if (shape === 'square') return '0'
  if (shape === 'rounded') return `${Math.max(2, Math.round(size * 0.22))}px`
  return '50%'
}
