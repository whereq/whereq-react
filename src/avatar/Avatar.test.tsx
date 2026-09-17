import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { AVATAR_PALETTE, colorFromName, initialsFromName, radiusFor } from './styles'

describe('initialsFromName', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFromName('Ada Lovelace')).toBe('AL')
    expect(initialsFromName('grace brewster hopper')).toBe('GB')
  })

  it('takes the first letters of a single word', () => {
    expect(initialsFromName('cher')).toBe('CH')
    expect(initialsFromName('x')).toBe('X')
  })

  it('handles CJK and empty input', () => {
    expect(initialsFromName('张伟')).toBe('张伟')
    expect(initialsFromName('')).toBe('')
    expect(initialsFromName(undefined)).toBe('')
  })
})

describe('colorFromName', () => {
  it('is deterministic and within the palette', () => {
    const a = colorFromName('Ada Lovelace')
    const b = colorFromName('Ada Lovelace')
    expect(a).toBe(b)
    expect(AVATAR_PALETTE).toContain(a as (typeof AVATAR_PALETTE)[number])
  })

  it('varies by name', () => {
    expect(colorFromName('Ada')).not.toBe(colorFromName('Ben Franklin'))
  })
})

describe('radiusFor', () => {
  it('maps shapes to radii', () => {
    expect(radiusFor('circle', 40)).toBe('50%')
    expect(radiusFor('square', 40)).toBe('0')
    expect(radiusFor('rounded', 40)).toBe('9px')
  })
})

describe('Avatar', () => {
  it('renders an image with alt from name and the requested object-position', () => {
    render(<Avatar src="/ada.jpg" name="Ada Lovelace" position="top" />)
    const img = screen.getByRole('img', { name: 'Ada Lovelace' }) as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('/ada.jpg')
    expect(img.style.objectPosition).toBe('top')
  })

  it('falls back to initials when there is no src', () => {
    render(<Avatar name="Grace Hopper" />)
    const el = screen.getByRole('img', { name: 'Grace Hopper' })
    expect(el.textContent).toBe('GH')
  })

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="/broken.jpg" name="Ada Lovelace" data-testid="av" />)
    fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }))
    // now the wrapper (labelled) shows initials instead of an <img>
    const el = screen.getByTestId('av')
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toBe('AL')
  })

  it('renders a status dot when status is set', () => {
    render(<Avatar name="Ada" status="online" data-testid="av" />)
    const dot = screen.getByTestId('av').querySelector('span > span[aria-hidden] + span')
    // simpler: there should be two absolutely-styled children (clip + dot)
    expect(screen.getByTestId('av').children.length).toBe(2)
    expect(dot ?? screen.getByTestId('av').lastElementChild).toBeTruthy()
  })

  it('applies an inset ring, size and forwards ref + rest props', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Avatar ref={ref} name="Ada" size={56} ring="#fff" ringWidth={2} data-testid="av" className="mine" />)
    const el = screen.getByTestId('av')
    expect(ref.current).toBe(el)
    expect(el).toHaveClass('mine')
    expect(el.style.width).toBe('56px')
    const clip = el.firstElementChild as HTMLElement
    expect(clip.style.boxShadow).toContain('inset')
  })
})

describe('AvatarGroup', () => {
  it('overlaps children and collapses overflow into a +N chip', () => {
    render(
      <AvatarGroup size={32} max={2} data-testid="grp">
        <Avatar name="Ada" />
        <Avatar name="Ben" />
        <Avatar name="Cai" />
        <Avatar name="Dee" />
      </AvatarGroup>,
    )
    const grp = screen.getByTestId('grp')
    // 2 shown + 1 overflow chip = 3 children
    expect(grp.children.length).toBe(3)
    expect(grp.textContent).toContain('+2')
  })

  it('shows all children when under the max', () => {
    render(
      <AvatarGroup data-testid="grp">
        <Avatar name="Ada" />
        <Avatar name="Ben" />
      </AvatarGroup>,
    )
    expect(screen.getByTestId('grp').children.length).toBe(2)
  })
})
