import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { CountryFlag } from './CountryFlag'
import {
  lookupFlag,
  isSupported,
  FLAG_CATALOG,
  SUPPORTED_SLUGS,
  FLAG_VIEWBOX,
  star5,
} from './flags'

describe('CountryFlag (rendering)', () => {
  it('renders an <svg> inside a wrapper span', () => {
    const { container } = render(<CountryFlag country="us" />)
    const wrap = container.firstChild as HTMLElement
    expect(wrap.tagName).toBe('SPAN')
    expect(wrap.getAttribute('role')).toBe('img')
    expect(wrap.querySelector('svg')).toBeTruthy()
  })

  it('uses the human-readable name as aria-label by default', () => {
    render(<CountryFlag country="us" />)
    expect(screen.getByRole('img', { name: 'United States' })).toBeTruthy()
  })

  it('respects an explicit alt override', () => {
    render(<CountryFlag country="us" alt="US" />)
    expect(screen.getByRole('img', { name: 'US' })).toBeTruthy()
  })

  it('falls back to the slug uppercased for unknown slugs (still renders neutral glyph)', () => {
    render(<CountryFlag country="zz" />)
    expect(screen.getByRole('img', { name: 'ZZ' })).toBeTruthy()
  })

  it('scales to size while keeping the 24:16 ratio (height = size × 2/3)', () => {
    const { container } = render(<CountryFlag country="us" size={30} />)
    const wrap = container.firstChild as HTMLElement
    const svg = wrap.querySelector('svg') as SVGElement
    expect(svg.getAttribute('width')).toBe('30')
    expect(svg.getAttribute('height')).toBe('20')
  })

  it('applies the shape via border-radius', () => {
    const { container } = render(<CountryFlag country="us" shape="circle" />)
    const wrap = container.firstChild as HTMLElement
    expect(wrap.style.borderRadius).toBe('50%')
  })

  it('uses preserveAspectRatio=slice when fit="slice"', () => {
    const { container } = render(<CountryFlag country="us" fit="slice" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice')
  })

  it('uses preserveAspectRatio=meet by default', () => {
    const { container } = render(<CountryFlag country="us" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet')
  })

  it('forwards a ref to the wrapper span', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<CountryFlag country="us" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('passes through extra DOM props (id, data-*)', () => {
    const { container } = render(<CountryFlag country="us" id="flag-us" data-testid="flag" />)
    const wrap = container.firstChild as HTMLElement
    expect(wrap.id).toBe('flag-us')
    expect(wrap.getAttribute('data-testid')).toBe('flag')
  })

  it('renders the shared FLAG_VIEWBOX attribute', () => {
    const { container } = render(<CountryFlag country="us" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('viewBox')).toBe(FLAG_VIEWBOX)
  })

  it('renders the US flag with 50 white-star polygons and 13 stripes', () => {
    const { container } = render(<CountryFlag country="us" />)
    const svg = container.querySelector('svg') as SVGElement
    // 7 red stripes + 6 white stripes = 13 stripe rects
    expect(svg.querySelectorAll('rect').length).toBeGreaterThanOrEqual(13)
    // 50 white star polygons (the canton rect is one of the rects too)
    const stars = svg.querySelectorAll('polygon')
    expect(stars.length).toBe(50)
    const reds = svg.querySelectorAll('rect[fill="#b22234"]')
    const whites = svg.querySelectorAll('rect[fill="#fff"]')
    expect(reds.length).toBe(7)
    expect(whites.length).toBeGreaterThanOrEqual(6)
  })

  it('renders the Japan flag as a red disc on white', () => {
    const { container } = render(<CountryFlag country="jp" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.querySelector('circle[fill="#bc002d"]')).toBeTruthy()
    expect(svg.querySelector('rect[fill="#fff"]')).toBeTruthy()
  })

  it('normalizes the country code (uppercase tolerated)', () => {
    const { container: a } = render(<CountryFlag country="us" />)
    const { container: b } = render(<CountryFlag country="US" />)
    expect((a.firstChild as HTMLElement).getAttribute('aria-label'))
      .toBe((b.firstChild as HTMLElement).getAttribute('aria-label'))
  })
})

describe('registry helpers', () => {
  it('lookupFlag returns the entry for known slugs', () => {
    expect(lookupFlag('us')?.name).toBe('United States')
    expect(lookupFlag('cn')?.name).toBe('China')
    expect(lookupFlag('NA')?.slug).toBe('na') // case-insensitive
  })

  it('lookupFlag returns undefined for unknown slugs', () => {
    expect(lookupFlag('zz')).toBeUndefined()
  })

  it('isSupported is true for the registered slugs and false otherwise', () => {
    expect(isSupported('us')).toBe(true)
    expect(isSupported('cn')).toBe(true)
    expect(isSupported('zz')).toBe(false)
    expect(isSupported('US')).toBe(true) // case-insensitive
  })

  it('SUPPORTED_SLUGS is sorted alphabetically', () => {
    const sorted = [...SUPPORTED_SLUGS].sort()
    expect(SUPPORTED_SLUGS).toEqual(sorted)
    expect(SUPPORTED_SLUGS.length).toBeGreaterThan(40) // we have a meaningful set
  })

  it('FLAG_CATALOG is name-sorted', () => {
    const names = FLAG_CATALOG.map((c) => c.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })

  it('every entry in FLAG_CATALOG resolves via lookupFlag', () => {
    for (const c of FLAG_CATALOG) {
      expect(lookupFlag(c.slug)?.name).toBe(c.name)
    }
  })
})

describe('star5 geometry', () => {
  it('emits 10 vertex pairs (5 outer + 5 inner radii)', () => {
    const points = star5(0, 0, 1)
    const pairs = points.trim().split(/\s+/)
    expect(pairs.length).toBe(10)
    for (const p of pairs) {
      expect(p.split(',')).toHaveLength(2)
    }
  })

  it('starts at the top vertex (negative-y apex)', () => {
    const points = star5(0, 0, 1)
    const first = points.split(/\s+/)[0]!.split(',').map(Number) as [number, number]
    const [firstX, firstY] = first
    // Apex y is the most negative y in the polygon
    const ys = points.split(/\s+/).map((p) => Number(p.split(',')[1]))
    const minY = Math.min(...ys.filter((n): n is number => Number.isFinite(n)))
    expect(firstY).toBe(minY)
    expect(Math.abs(firstX)).toBeLessThan(0.001)
  })
})
