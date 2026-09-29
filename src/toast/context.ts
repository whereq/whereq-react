'use client'

import { useContext } from 'react'
import { ToastContext } from './Toast'
import type { ToastContextValue } from './types'

/** Read the imperative toast api + subscribe helper from the nearest
 *  ToastProvider. Throws if no provider is mounted up the tree — same
 *  contract as the rest of the whereq family libs (forwardRef components
 *  etc.): components that need a provider fail loudly when called without
 *  it, instead of silently doing nothing. */
export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext() must be called inside a ToastProvider.')
  return ctx
}

/** Convenience hook: returns just the imperative toast handle, ignoring
 *  subscribe. Same null-check contract as useToastContext(). */
export function useToast() {
  return useToastContext()
}
