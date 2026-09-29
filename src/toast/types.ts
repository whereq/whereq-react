import type { HTMLAttributes, ReactNode } from 'react'

/** Severity / colour preset for the toast border, icon, and accent. */
export type ToastVariant = 'default' | 'success' | 'warning' | 'error'

/** Context value exposed by {@link ToastProvider}: the imperative api plus a
 *  `subscribe` helper for advanced consumers that want to react to the raw
 *  queue outside React (e.g. analytics). Most consumers never touch this —
 *  `toast.notify(...)` etc. is enough. */
export interface ToastContextValue extends ToastApi {
  subscribe: (listener: (items: ToastItem[]) => void) => () => void
}


/** Screen position for the toast stack viewport. */
export type ToastPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** Single toast entry shown in the stack. */
export interface ToastItem {
  /** Unique id — auto-generated if not provided. */
  id: string
  /** Severity preset. Default `'default'`. */
  variant?: ToastVariant
  /** Main message — kept short (one line). */
  title: string
  /** Optional secondary message (1–2 lines). Accepts a plain string or
   *  arbitrary ReactNode (e.g. a span with <code>). */
  description?: ReactNode
  /** Stack position. Inherited from the provider if not set. */
  position?: ToastPosition
  /** Auto-dismiss delay in ms. Default 4000. Set to 0 to disable. */
  duration?: number
  /** Optional primary action button (e.g. "Undo", "View"). */
  action?: { label: string; onClick: () => void }
  /** Show or hide. Controlled externally by the API. */
  open: boolean
  /** Created-at ms (set by the toast API; used for stack ordering + animations). */
  createdAt: number
}

/** Props for the {@link ToastViewport} container that renders the toast stack. */
export interface ToastViewportProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Where to stack toasts. Default `'bottom-right'`. */
  position?: ToastPosition
  /** Max simultaneous toasts; older are dropped. Default 5. */
  maxVisible?: number
  /** Space-separated aria-live politeness. Default `'polite'`. */
  ariaLive?: 'polite' | 'assertive' | 'off'
}

/** Public imperative API — use as `toast.error('Title', { description: 'Detail' })`. */
export interface ToastOptions {
  /** Stable id (omit to auto-generate). Updates / dismisses target by id. */
  id?: string
  description?: ReactNode
  duration?: number
  position?: ToastPosition
  action?: { label: string; onClick: () => void }
}

/** The actual imperative handle returned by the toast API. Methods are
 *  attached to a plain object (not a callable function) — call `toast.notify`
 *  for the default-variant case, or `toast.error` / `toast.success` / etc.
 *  for explicit variants. This avoids the TS friction of mixing a call
 *  signature with a getter on a single interface, and matches the most
 *  common React toast API conventions (Sonner, react-hot-toast, Radix). */
export interface ToastApi {
  /** Create a toast with the default variant. */
  notify: (title: ReactNode, options?: ToastOptions) => string
  /** Create a toast with a specific variant. */
  success: (title: ReactNode, options?: ToastOptions) => string
  warning: (title: ReactNode, options?: ToastOptions) => string
  error: (title: ReactNode, options?: ToastOptions) => string
  info: (title: ReactNode, options?: ToastOptions) => string
  /** Update an existing toast by id (returns false if not found). */
  update: (id: string, patch: Partial<ToastOptions> & { title?: ReactNode }) => boolean
  /** Dismiss by id (no-op if absent); returns false if not found. */
  dismiss: (id?: string) => boolean
  /** Render a custom ReactNode as the toast body (escape hatch). */
  custom: (body: ReactNode, options?: ToastOptions & { variant?: ToastVariant }) => string
  /** Reset the queue (e.g. on logout). */
  clear: () => void
  /** The current stack (read-only snapshot). */
  items: readonly ToastItem[]
}
