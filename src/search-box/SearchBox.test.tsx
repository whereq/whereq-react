import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { SearchBox } from './SearchBox'
import type { SearchBoxSuggestion } from './types'

const SUGGESTIONS: SearchBoxSuggestion[] = [
  { key: 'p1', label: 'Banff', description: 'Alberta, Canada' },
  { key: 'p2', label: 'Banff National Park', description: 'Rocky Mountains' },
  { key: 'p3', label: 'Banff, Ontario', description: 'Canada' },
]

describe('SearchBox', () => {
  it('renders the value and the placeholder', () => {
    render(<SearchBox value="ban" onChange={() => {}} placeholder="Search addresses" />)
    const input = screen.getByPlaceholderText('Search addresses') as HTMLInputElement
    expect(input.value).toBe('ban')
  })

  it('is a combobox that points at the listbox', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    const listbox = screen.getByRole('listbox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
  })

  it('renders one option per suggestion', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByText('Banff')).toBeTruthy()
    expect(screen.getByText('Alberta, Canada')).toBeTruthy()
  })

  it('hides the list when there are no suggestions', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={[]} />)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect((screen.getByRole('combobox') as HTMLInputElement).getAttribute('aria-expanded')).toBe('false')
  })

  it('highlights the first suggestion by default', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    const listId = screen.getByRole('listbox').id
    expect(input.getAttribute('aria-activedescendant')).toBe(`${listId}-option-0`)
  })

  it('moves the highlight with the arrow keys, wrapping around', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    const listId = screen.getByRole('listbox').id

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe(`${listId}-option-1`)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.getAttribute('aria-activedescendant')).toBe(`${listId}-option-2`)
  })

  it('picks a suggestion when an option is pressed', () => {
    const onSelect = vi.fn()
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} onSelect={onSelect} />)
    const options = screen.getAllByRole('option')
    fireEvent.mouseDown(options[1] as HTMLElement)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1], 1)
  })

  it('picks the highlighted suggestion on Enter', () => {
    const onSelect = vi.fn()
    const onSubmit = vi.fn()
    render(
      <SearchBox
        value="ban"
        onChange={() => {}}
        suggestions={SUGGESTIONS}
        onSelect={onSelect}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the typed text on Enter when nothing is highlighted', () => {
    const onSelect = vi.fn()
    const onSubmit = vi.fn()
    render(
      <SearchBox
        value="12 Hurst Ave"
        onChange={() => {}}
        suggestions={[]}
        onSelect={onSelect}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('12 Hurst Ave')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('always submits the text with submitBehavior="always-submit"', () => {
    const onSelect = vi.fn()
    const onSubmit = vi.fn()
    render(
      <SearchBox
        value="ban"
        onChange={() => {}}
        suggestions={SUGGESTIONS}
        submitBehavior="always-submit"
        onSelect={onSelect}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('ban')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('submits from the magnifier button', () => {
    const onSubmit = vi.fn()
    render(<SearchBox value="banff" onChange={() => {}} suggestions={[]} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSubmit).toHaveBeenCalledWith('banff')
  })

  it('does not submit an empty query', () => {
    const onSubmit = vi.fn()
    render(<SearchBox value="   " onChange={() => {}} suggestions={[]} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the box', () => {
    const onChange = vi.fn()
    render(<SearchBox value="banff" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('has no clear button when the box is empty', () => {
    render(<SearchBox value="" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  })

  it('closes the list on Escape', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes the list when the user clicks outside', () => {
    render(<SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} />)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('shows the status line while loading', () => {
    render(<SearchBox value="ban" onChange={() => {}} loading />)
    expect(screen.getByText('Searching…')).toBeTruthy()
  })

  it('applies the theme as CSS custom properties', () => {
    const { container } = render(
      <SearchBox value="ban" onChange={() => {}} theme={{ fieldBg: '#101010', radius: '10px' }} />,
    )
    const root = container.firstChild as HTMLElement
    expect(root.style.getPropertyValue('--wq-search-field-bg')).toBe('#101010')
    expect(root.style.getPropertyValue('--wq-search-radius')).toBe('10px')
    // Untouched tokens are left to the stylesheet.
    expect(root.style.getPropertyValue('--wq-search-text')).toBe('')
  })

  it('injects its stylesheet once', () => {
    render(<SearchBox value="a" onChange={() => {}} />)
    render(<SearchBox value="b" onChange={() => {}} />)
    expect(document.querySelectorAll('#wq-search-box-styles')).toHaveLength(1)
  })

  it('reports the highlight through onHighlightChange', () => {
    const onHighlightChange = vi.fn()
    render(
      <SearchBox
        value="ban"
        onChange={() => {}}
        suggestions={SUGGESTIONS}
        onHighlightChange={onHighlightChange}
      />,
    )
    expect(onHighlightChange).toHaveBeenCalledWith(0)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
    expect(onHighlightChange).toHaveBeenLastCalledWith(1)
  })

  it('works as a controlled box', () => {
    function Controlled() {
      const [value, setValue] = useState('')
      return <SearchBox value={value} onChange={setValue} placeholder="Type here" />
    }
    render(<Controlled />)
    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ban' } })
    expect(input.value).toBe('ban')
  })

  it('renders the rows through renderOption', () => {
    render(
      <SearchBox
        value="ban"
        onChange={() => {}}
        suggestions={SUGGESTIONS}
        renderOption={(s, index, active) => (
          <span data-testid={`row-${index}`} data-active={active ? 'yes' : 'no'}>
            {s.label}
          </span>
        )}
      />,
    )
    const rows = screen.getAllByTestId(/^row-/)
    expect(rows).toHaveLength(3)
    expect(rows[0]?.textContent).toBe('Banff')
    expect(rows[0]?.getAttribute('data-active')).toBe('yes')
  })

  it('shows the empty text when nothing matched', () => {
    render(<SearchBox value="zzz" onChange={() => {}} suggestions={[]} emptyText="Nothing found" />)
    expect(screen.getByText('Nothing found')).toBeTruthy()
  })

  it('does not show the empty text for an empty query', () => {
    render(<SearchBox value="" onChange={() => {}} suggestions={[]} emptyText="Nothing found" />)
    expect(screen.queryByText('Nothing found')).toBeNull()
  })

  it('hands the clear to onClear when it is given', () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    render(<SearchBox value="Banff" onChange={onChange} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders the magnifier as decoration when there is nothing to submit', () => {
    const { container } = render(<SearchBox value="ban" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
    expect(container.querySelector('.wq-search__submit')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('adds the option classes to every row', () => {
    const { container } = render(
      <SearchBox value="ban" onChange={() => {}} suggestions={SUGGESTIONS} optionClassName="my-row" />,
    )
    expect(container.querySelectorAll('li.my-row')).toHaveLength(3)
  })

  it('reports the input focus', () => {
    const onFocus = vi.fn()
    render(<SearchBox value="Banff" onChange={() => {}} onFocus={onFocus} />)
    fireEvent.focus(screen.getByRole('combobox'))
    expect(onFocus).toHaveBeenCalledTimes(1)
  })
})
