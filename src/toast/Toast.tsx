'use client'

/**
 * Inline-rendered toast stack + imperative API.
 *
 * Public surface:
 *  - `ToastProvider` — wrap your app, holds the toast queue.
 *  - `ToastViewport`  — renders the toast stack at the configured position.
 *  - `toast.notify('Title', { variant: 'error' })` etc. — the imperative
 *    handle. Call from anywhere (event handlers, async callbacks, plain JS).
 *
 * @example
 * ```tsx
 * <ToastProvider><ToastViewport /></ToastProvider>
 *
 * // later, anywhere in your code:
 * toast.notify('Hello', { variant: 'default' })
 * toast.error('Save failed', { description: 'Try again' })
 * toast.success('Saved')
 * ```
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type {
  ToastApi,
  ToastContextValue,
  ToastItem,
  ToastOptions,
  ToastPosition,
  ToastVariant,
  ToastViewportProps,
} from './types'

// ── Style helpers ────────────────────────────────────────────────────────

const POSITION_STYLE: Record<ToastPosition, CSSProperties> = {
  'top-left': { top: 16, left: 16 },
  'top-center': { top: 16, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'bottom-center': { bottom: 16, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 16, right: 16 },
}

const VARIANT_COLOR: Record<ToastVariant, { fg: string; bg: string; border: string }> = {
  default: { fg: 'var(--text)', bg: 'var(--bg-soft)', border: 'var(--rule)' },
  success: { fg: 'var(--up)', bg: 'var(--up)/10', border: 'var(--up)/30' },
  warning: { fg: 'var(--nova)', bg: 'var(--nova)/10', border: 'var(--nova)/30' },
  error:   { fg: 'var(--down)', bg: 'var(--down)/10', border: 'var(--down)/30' },
}

const DEFAULT_DURATION = 4000

/** Convenience helper exported for tests. */
export function toastClasses(variant: ToastVariant = 'default'): string {
  return `toast-${variant}`
}

function IconFor({ v }: { v: ToastVariant }): ReactNode {
  const c = VARIANT_COLOR[v]
  const s: CSSProperties = { width: 16, height: 16, color: c.fg, flex: '0 0 auto' }
  const common = {
    fill: 'none', stroke: 'currentColor', strokeWidth: 2.2,
    strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24',
  } as const
  switch (v) {
    case 'success':
      return (<svg {...common} style={s} aria-hidden><path d="M5 12.5l4 4 10-10" /></svg>)
    case 'warning':
      return (<svg {...common} style={s} aria-hidden><path d="M12 3l10 18H2z" /><path d="M12 10v5" /></svg>)
    case 'error':
      return (<svg {...common} style={s} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>)
    default:
      return (<svg {...common} style={s} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 8v6" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /></svg>)
  }
}

// ── Context ────────────────────────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue | null>(null)


// ── Provider ─────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const listeners = useRef<Set<(items: ToastItem[]) => void>>(new Set())
  const counter = useRef(0)
  const reactId = useId()
  const newId = useCallback(() => `t${reactId.replace(/:/g, '')}${(counter.current++).toString(36)}`, [reactId])

  const push = useCallback((item: ToastItem) => {
    setItems((prev) => {
      const exists = prev.findIndex((p) => p.id === item.id) >= 0
      const next = exists
        ? prev.map((p) => (p.id === item.id ? item : p))
        : [...prev, item]
      for (const l of listeners.current) l(next)
      return next
    })
  }, [])

  const dismiss = useCallback((id?: string): boolean => {
    let removed = false
    setItems((prev) => {
      const next = id ? prev.filter((p) => p.id !== id) : []
      removed = next.length !== prev.length
      for (const l of listeners.current) l(next)
      return next
    })
    return removed
  }, [])

  const clear = useCallback(() => {
    setItems([])
    for (const l of listeners.current) l([])
  }, [])

  const itemsRef = useRef(items)
  itemsRef.current = items

  const api: ToastApi = useMemo(() => {
    const make = (variant: ToastVariant) =>
      (title: ReactNode, options: ToastOptions = {}) => {        const id = options.id ?? newId()
        push({
          id,
          open: true,
          createdAt: Date.now(),
          variant,
          title: title as string,
          description: options.description,
          duration: options.duration,
          position: options.position,
          action: options.action,
        })
        return id
      }
    return {
      notify: make('default'),
      success: make('success'),
      warning: make('warning'),
      error:   make('error'),
      info:    make('default'),
      custom:  make('default'),
      update: (id, patch) => {
        let found = false
        setItems((prev) => {
          const next = prev.map((p) => {
            if (p.id !== id) return p
            found = true
            return { ...p, ...patch, title: (patch.title ?? p.title) as string }
          })
          for (const l of listeners.current) l(next)
          return next
        })
        return found
      },
      dismiss,
      clear,
      get items() { return itemsRef.current },
    }
  }, [push, dismiss, clear, newId])

  const subscribe = useCallback((listener: (items: ToastItem[]) => void) => {
    listeners.current.add(listener)
    return () => { listeners.current.delete(listener) }
  }, [])

  // Mount: install the api into the module-level imperative `toast()` handle.
  useEffect(() => setToastApi(api), [api])
  // Unmount: clear on full unmount.
  useEffect(() => () => clearToastApi(), [])

  // The context value changes whenever `items` changes so consumers
  // (e.g. ToastViewport) re-render. `api` itself is memoized (its getter
  // reads itemsRef.current at render time); wrapping the spread in a
  // fresh object lets React's referential-equality bail-out trigger.
  const ctxValue = useMemo<ToastContextValue>(
    () => ({ ...api, items, subscribe }),
    [api, items, subscribe],
  )

  return <ToastContext.Provider value={ctxValue}>{children}</ToastContext.Provider>
}

// ── Viewport (renders the queue) ────────────────────────────────────────

export const ToastViewport = forwardRef<HTMLDivElement, ToastViewportProps>(
  function ToastViewport(props, ref) {
    const {
      position = 'bottom-right',
      maxVisible = 5,
      ariaLive = 'polite',
      className,
      style,
      ...rest
    } = props
    const ctx = useContext(ToastContext)
    const items = ctx?.items ?? []
    const visible = items.slice(-maxVisible)

    return (
      <div
        ref={ref}
        role="region"
        aria-live={ariaLive}
        aria-label="Notifications"
        className={className}
        style={{
          position: 'fixed',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          ...POSITION_STYLE[position],
          ...style,
        }}
        {...rest}
      >
        {visible.map((it) => (ctx ? <ToastCard key={it.id} item={it} api={ctx} /> : null))}
      </div>
    )
  }
)

// ── Single toast card ────────────────────────────────────────────────────

function ToastCard({ item, api }: { item: ToastItem; api: ToastContextValue }) {
  const [exiting, setExiting] = useState(false)
  const [paused, setPaused] = useState(false)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dur = item.duration ?? DEFAULT_DURATION

  const startTimer = useCallback(() => {
    if (tRef.current) clearTimeout(tRef.current)
    if (dur <= 0) return
    tRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => api.dismiss(item.id), 140)
    }, dur)
  }, [api, item.id, dur])

  useEffect(() => {
    if (paused || exiting) return
    startTimer()
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [paused, exiting, startTimer])

  const v: ToastVariant = item.variant ?? 'default'
  const c = VARIANT_COLOR[v]
  const dismiss = () => {
    setExiting(true)
    setTimeout(() => api.dismiss(item.id), 140)
  }

  return (
    <div
      role={v === 'error' ? 'alert' : 'status'}
      data-variant={v}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{
        pointerEvents: 'auto',
        background: c.bg,
        color: 'var(--text)',
        border: `1px solid ${c.border}`,
        borderRadius: '2px',
        padding: '10px 12px',
        minWidth: 260,
        maxWidth: 420,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        opacity: exiting ? 0 : 1,
        transition: 'opacity 140ms ease-in',
      }}
    >
      <IconFor v={v} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: c.fg }}>{item.title}</div>
        {item.description && (
          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--text-dim)' }}>{item.description}</div>
        )}
        {item.action && (
          <button
            onClick={() => { item.action!.onClick(); dismiss() }}
            className="mt-2 rounded border px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: c.fg, borderColor: c.border, backgroundColor: 'transparent' }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="opacity-50 hover:opacity-100"
        style={{ background: 'transparent', border: 0, color: 'var(--text-faint)', cursor: 'pointer', padding: 2, marginLeft: 4 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}


// ── Module-level imperative handle ─────────────────────────────────────
//
// ToastProvider calls setToastApi(api) on mount and clearToastApi() on unmount.
// We expose a Proxy whose traps always read from the current api reference
// at call time — no stale closure, no Object.assign mutability issues, no
// per-method rebinding. Consumers get a single named import (toast) that
// always reflects the most-recently-mounted provider, and throws if none
// has ever mounted (which is the same null-check contract as useToast).
let _current: ToastApi | null = null
function setToastApi(api: ToastApi) { _current = api }
function clearToastApi() { _current = null }

function _err(name: string): never {
  throw new Error(`toast.${name} called before any ToastProvider mounted. Wrap your app with <ToastProvider>.`)
}
const _STUB: ToastApi = {
  notify: () => _err('notify'),
  success: () => _err('success'),
  warning: () => _err('warning'),
  error:   () => _err('error'),
  info:    () => _err('info'),
  custom:  () => _err('custom'),
  update:  () => _err('update'),
  dismiss: () => _err('dismiss'),
  clear:   () => _err('clear'),
  get items() { return _current?.items ?? [] },
}

/** Imperative toast handle. Always reads the current api reference via
 *  Proxy traps — no stale closure, no assign-time mutation, no per-method
 *  rebinding. The `items` getter is the only state — it falls back to `[]`
 *  before any provider mounts. */
export const toast: ToastApi = new Proxy(_STUB, {
  get(_t, prop) {
    if (!_current) {
      // Still not mounted — return the throwing stub so the user gets a
      // clear error (not silent failure).
      return (_STUB as unknown as Record<string | symbol, unknown>)[prop]
    }
    const v = (_current as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof v === 'function') return (v as (...a: unknown[]) => unknown).bind(_current)
    return v
  },
}) as ToastApi

export { setToastApi as mountToastApi, clearToastApi as unmountToastApi }
// Re-export the React hook from ./context for convenience. Consumers can
// import everything they need from the top-level @whereq/react entry.
export { useToastContext as useToast } from './context'
