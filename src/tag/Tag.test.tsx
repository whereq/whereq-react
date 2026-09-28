import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Tag, TagImpl, tagClasses } from './Tag'

describe('Tag', () => {
  it('renders the children as text', () => {
    render(<Tag>Public · daily</Tag>)
    expect(screen.getByText('Public · daily')).toBeTruthy()
  })

  it('defaults to subtle variant with sm size', () => {
    const { container } = render(<Tag>x</Tag>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('border-[var(--rule)]')
    expect(el.className).toContain('rounded-full')
    expect(el.className).toContain('text-[10px]')
    expect(el.className).toContain('uppercase')
  })

  it('applies the solid variant styles', () => {
    const { container } = render(<Tag variant="solid">x</Tag>)
    expect((container.firstChild as HTMLElement).className).toContain('bg-[var(--accent)]/10')
  })

  it('renders a leading dot in dot variant', () => {
    const { container } = render(<Tag variant="dot">Operational</Tag>)
    expect(container.querySelector('span[aria-hidden]')).toBeTruthy()
  })

  it('uses the dot color when provided', () => {
    const { container } = render(
      <Tag variant="dot" dotColor="var(--up)">Live</Tag>
    )
    const dot = container.querySelector('span[aria-hidden]') as HTMLElement
    expect(dot.style.backgroundColor).toBe('var(--up)')
  })

  it('applies the link variant hover styles', () => {
    const { container } = render(<Tag variant="link">Back</Tag>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('hover:border-[var(--accent)]')
    expect(el.className).toContain('hover:text-[var(--accent)]')
  })

  it('renders as <a> when as="a" + supports href', () => {
    const { container } = render(
      <TagImpl<'a'> as="a" href="/domains/finance">Finance</TagImpl>
    )
    const el = container.firstChild as HTMLElement
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe('/domains/finance')
  })

  it('renders as <button> when as="button"', () => {
    const { container } = render(
      <TagImpl<'button'> as="button" onClick={() => {}}>Click</TagImpl>
    )
    expect((container.firstChild as HTMLElement).tagName).toBe('BUTTON')
  })

  it('forwards a ref to the rendered element', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Tag ref={ref}>x</Tag>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('passes through extra className + style', () => {
    const { container } = render(<Tag className="extra-class">x</Tag>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('extra-class')
  })

  it('uses the larger size step when size="md"', () => {
    const { container } = render(<Tag size="md">x</Tag>)
    expect((container.firstChild as HTMLElement).className).toContain('text-sm')
  })
})

describe('tagClasses helper', () => {
  it('returns subtle + sm by default', () => {
    const cls = tagClasses()
    expect(cls).toContain('text-[10px]')
    expect(cls).toContain('border-[var(--rule)]')
  })
  it('mixes in solid + md when both provided', () => {
    const cls = tagClasses('solid', 'md')
    expect(cls).toContain('bg-[var(--accent)]/10')
    expect(cls).toContain('text-sm')
  })
})
