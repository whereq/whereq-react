import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createRef } from 'react'
import { Scrollbar } from './Scrollbar'
import { GlobalScrollbar } from './GlobalScrollbar'
import { resolveColors, buildGlobalScrollbarCss, SCROLLBAR_CLASS } from './styles'

describe('resolveColors', () => {
  it('defaults to the auto (light-dark) theme', () => {
    const c = resolveColors()
    expect(c.thumb).toContain('light-dark')
    expect(c.track).toBe('transparent')
  })

  it('applies theme presets', () => {
    expect(resolveColors('dark').thumb).toBe('rgba(255, 255, 255, 0.1)')
    expect(resolveColors('light').thumb).toBe('rgba(0, 0, 0, 0.18)')
    expect(resolveColors('neutral').thumb).toContain('128')
  })

  it('lets explicit colours override the theme', () => {
    const c = resolveColors('dark', { thumbColor: '#f00', trackColor: '#0f0' })
    expect(c.thumb).toBe('#f00')
    expect(c.track).toBe('#0f0')
    // untouched token still comes from the preset
    expect(c.thumbHover).toBe('rgba(255, 255, 255, 0.2)')
  })
})

describe('Scrollbar', () => {
  beforeEach(() => {
    document.getElementById('wq-scrollbar-styles')?.remove()
  })

  it('renders children and injects the base stylesheet once', () => {
    render(
      <Scrollbar data-testid="sb">
        <p>content</p>
      </Scrollbar>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(document.querySelectorAll('#wq-scrollbar-styles')).toHaveLength(1)
    expect(screen.getByTestId('sb')).toHaveClass(SCROLLBAR_CLASS)
  })

  it('sets the vertical overflow and CSS custom properties from props', () => {
    render(<Scrollbar data-testid="sb" size={10} radius={4} theme="dark" />)
    const el = screen.getByTestId('sb')
    expect(el.style.overflowY).toBe('auto')
    expect(el.style.overflowX).toBe('hidden')
    expect(el.style.getPropertyValue('--wq-sb-size')).toBe('10px')
    expect(el.style.getPropertyValue('--wq-sb-radius')).toBe('4px')
    expect(el.style.getPropertyValue('--wq-sb-thumb')).toBe('rgba(255, 255, 255, 0.1)')
  })

  it('defaults radius to half the size', () => {
    render(<Scrollbar data-testid="sb" size={8} />)
    expect(screen.getByTestId('sb').style.getPropertyValue('--wq-sb-radius')).toBe('4px')
  })

  it('supports horizontal and both axes', () => {
    const { rerender } = render(<Scrollbar data-testid="sb" axis="horizontal" />)
    expect(screen.getByTestId('sb').style.overflowX).toBe('auto')
    expect(screen.getByTestId('sb').style.overflowY).toBe('hidden')
    rerender(<Scrollbar data-testid="sb" axis="both" />)
    expect(screen.getByTestId('sb').style.overflow).toBe('auto')
  })

  it('toggles data-wq-scrolling while scrolling when autoHide is on', () => {
    vi.useFakeTimers()
    render(<Scrollbar data-testid="sb" autoHide autoHideDelay={500} />)
    const el = screen.getByTestId('sb')
    expect(el).toHaveClass('wq-scrollbar--auto-hide')
    fireEvent.scroll(el)
    expect(el).toHaveAttribute('data-wq-scrolling', 'true')
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(el).not.toHaveAttribute('data-wq-scrolling')
    vi.useRealTimers()
  })

  it('forwards the ref and user onScroll + className/style', () => {
    const ref = createRef<HTMLDivElement>()
    const onScroll = vi.fn()
    render(
      <Scrollbar
        ref={ref}
        data-testid="sb"
        className="mine"
        style={{ maxHeight: 200 }}
        onScroll={onScroll}
      />,
    )
    const el = screen.getByTestId('sb')
    expect(ref.current).toBe(el)
    expect(el).toHaveClass('mine')
    expect(el.style.maxHeight).toBe('200px')
    fireEvent.scroll(el)
    expect(onScroll).toHaveBeenCalledTimes(1)
  })
})

describe('GlobalScrollbar / buildGlobalScrollbarCss', () => {
  beforeEach(() => {
    document.getElementById('wq-scrollbar-global')?.remove()
  })

  it('builds CSS targeting every scrollbar by default', () => {
    const css = buildGlobalScrollbarCss({ theme: 'dark', size: 8 })
    expect(css).toContain('*, *::before, *::after')
    expect(css).toContain('::-webkit-scrollbar { width: 8px; height: 8px; }')
    expect(css).toContain('rgba(255, 255, 255, 0.1)')
  })

  it('can scope to a custom selector', () => {
    const css = buildGlobalScrollbarCss({ selector: 'html', theme: 'light' })
    expect(css).toContain('html ::-webkit-scrollbar')
  })

  it('injects and cleans up a single global <style> element', () => {
    const { unmount } = render(<GlobalScrollbar theme="dark" />)
    expect(document.querySelectorAll('#wq-scrollbar-global')).toHaveLength(1)
    unmount()
    expect(document.getElementById('wq-scrollbar-global')).toBeNull()
  })
})
