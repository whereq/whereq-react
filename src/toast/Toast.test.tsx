import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useEffect } from 'react'
import { toastClasses, ToastProvider, ToastViewport, useToast } from './Toast'
import type { ToastApi } from './types'

describe('toastClasses helper', () => {
  it('maps variants to a token class', () => {
    expect(toastClasses('default')).toContain('toast-default')
    expect(toastClasses('success')).toContain('toast-success')
    expect(toastClasses('error')).toContain('toast-error')
    expect(toastClasses('warning')).toContain('toast-warning')
  })
})

/** Captures the imperative api via context (mirror of the public useToast
 *  hook — exposes a window.__lastApi variable so the test can fire commands
 *  after mount). */
function ApiCapture({ onReady }: { onReady: (api: ToastApi) => void }) {
  const api = useToast()
  useEffect(() => { onReady(api) }, [onReady, api])
  return null
}

describe('ToastProvider + ToastViewport (integration)', () => {
  it('renders no toast cards for an empty queue', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    )
    expect(container.querySelector('[role="status"], [role="alert"]')).toBeNull()
  })

  it('renders a pushed toast with the expected title + role=status', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport data-testid="vp" />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => api!.notify('Hello world'))
    expect(screen.getByText('Hello world')).toBeTruthy()
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders an error toast with role=alert', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => api!.error('Save failed'))
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Save failed')).toBeTruthy()
  })

  it('renders description when provided', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => api!.notify('Title', { description: 'Detail line' }))
    expect(screen.getByText('Detail line')).toBeTruthy()
  })

  it('renders an action button when provided', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => api!.notify('Saved', { action: { label: 'Undo', onClick: () => {} } }))
    expect(screen.getByText('Undo')).toBeTruthy()
  })

  it('update() modifies an existing toast', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    let id: string | undefined
    act(() => { id = api!.notify('Original') })
    act(() => api!.update(id!, { title: 'Updated' }))
    expect(screen.getByText('Updated')).toBeTruthy()
    expect(screen.queryByText('Original')).toBeNull()
  })

  it('dismiss() removes a toast by id', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    let id: string | undefined
    act(() => { id = api!.notify('Bye') })
    expect(screen.getByText('Bye')).toBeTruthy()
    act(() => api!.dismiss(id))
    expect(screen.queryByText('Bye')).toBeNull()
  })

  it('clear() removes all toasts', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => { api!.notify('A'); api!.notify('B') })
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
    act(() => api!.clear())
    expect(screen.queryByText('A')).toBeNull()
    expect(screen.queryByText('B')).toBeNull()
  })

  it('viewport position="top-left" stacks at top-left', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport position="top-left" />
      </ToastProvider>
    )
    const viewport = container.querySelector('[role="region"]') as HTMLElement
    expect(viewport.style.top).toBe('16px')
    expect(viewport.style.left).toBe('16px')
  })

  it('respects maxVisible by FIFO-dropping the oldest', () => {
    let api: ToastApi | undefined
    render(
      <ToastProvider>
        <ToastViewport maxVisible={2} />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => {
      api!.notify('1')
      api!.notify('2')
      api!.notify('3') // drops '1'
    })
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('matches the metroUI xs radius (2px) on the rendered card', () => {
    let api: ToastApi | undefined
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
        <ApiCapture onReady={(a) => { api = a }} />
      </ToastProvider>
    )
    act(() => api!.notify('Hi'))
    const card = container.querySelector('[role="status"]') as HTMLElement
    expect(card.style.borderRadius).toBe('2px')
  })
})
