import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SearchBox } from './SearchBox'
import type { SearchBoxSuggestion } from './types'

const SUGGESTIONS: SearchBoxSuggestion[] = [
  { key: 'p1', label: 'Banff', description: 'Alberta, Canada' },
  { key: 'p2', label: 'Banff National Park', description: 'Rocky Mountains, Canada' },
  { key: 'p3', label: 'Banff, Ontario', description: 'Canada' },
]

const meta: Meta<typeof SearchBox> = {
  title: 'Components/SearchBox',
  component: SearchBox,
  tags: ['autodocs'],
  args: {
    value: 'ban',
    onChange: () => {},
    placeholder: 'Search addresses & places',
  },
  parameters: {
    docs: {
      description: {
        component:
          'A generic search box with a suggestion dropdown. The component owns the field, the magnifier (submit), the clear button, the dropdown, the keyboard navigation and the ARIA wiring; the caller supplies the data and the two callbacks that mean something to the domain (onSelect, onSubmit). Theming runs through the --wq-search-* CSS custom properties.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof SearchBox>

export const Empty: Story = {
  args: { value: '', suggestions: [] },
}

export const WithSuggestions: Story = {
  args: { value: 'ban', suggestions: SUGGESTIONS },
}

export const Loading: Story = {
  args: { value: 'ban', suggestions: [], loading: true },
}

export const Interactive: Story = {
  render: (args) => <InteractiveSearchBox {...args} />,
}

function InteractiveSearchBox(args: React.ComponentProps<typeof SearchBox>) {
  const [value, setValue] = useState('ban')
  return (
    <div style={{ maxWidth: 420 }}>
      <SearchBox
        {...args}
        value={value}
        onChange={setValue}
        suggestions={value.length > 1 ? SUGGESTIONS : []}
        onSelect={(s) => setValue(String(s.label))}
        onSubmit={(text) => setValue(`submitted: ${text}`)}
      />
      <p style={{ color: '#8b949e', fontSize: 12, marginTop: 12 }}>value: {value}</p>
    </div>
  )
}

export const CustomTheme: Story = {
  args: {
    value: 'ban',
    suggestions: SUGGESTIONS,
    theme: {
      fieldBg: '#0f172a',
      fieldBorder: '#334155',
      text: '#e2e8f0',
      iconHover: '#38bdf8',
      listBg: '#020617',
      listActiveBg: '#1e293b',
      listActiveText: '#38bdf8',
    },
  },
}
