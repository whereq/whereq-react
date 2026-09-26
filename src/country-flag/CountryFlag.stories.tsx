import type { Meta, StoryObj } from '@storybook/react'
import { CountryFlag } from './CountryFlag'
import { FLAG_CATALOG } from './flags'

const meta: Meta<typeof CountryFlag> = {
  title: 'Components/CountryFlag',
  component: CountryFlag,
  tags: ['autodocs'],
  args: {
    country: 'us',
    size: 28,
    shape: 'rounded',
    fit: 'contain',
  },
  argTypes: {
    country: { control: 'text' },
    size: { control: { type: 'range', min: 16, max: 96, step: 2 } },
    shape: { control: 'inline-radio', options: ['rect', 'rounded', 'circle'] },
    fit: { control: 'inline-radio', options: ['contain', 'slice'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'An inline-SVG country flag chip. Renders identically on any device — no emoji or system-font dependency. The shared registry covers 40+ major economies + the `na`/`eu` continent pseudo-codes; unknown slugs fall through to the continent emblem so the chip never renders empty.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof CountryFlag>

export const UnitedStates: Story = {
  args: { country: 'us' },
}

export const China: Story = {
  args: { country: 'cn' },
}

export const EuropeanUnion: Story = {
  args: { country: 'eu', alt: 'European Union' },
}

export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CountryFlag {...args} country="us" shape="rect" />
      <CountryFlag {...args} country="us" shape="rounded" />
      <CountryFlag {...args} country="us" shape="circle" />
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CountryFlag {...args} country="us" size={16} />
      <CountryFlag {...args} country="us" size={20} />
      <CountryFlag {...args} country="us" size={28} />
      <CountryFlag {...args} country="us" size={48} />
      <CountryFlag {...args} country="us" size={72} />
    </div>
  ),
}

export const Catalog: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
      {FLAG_CATALOG.map((c) => (
        <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, border: '1px solid #e4e8ee', borderRadius: 4 }}>
          <CountryFlag {...args} country={c.slug} size={20} />
          <span style={{ fontSize: 12 }}>{c.name}</span>
        </div>
      ))}
    </div>
  ),
}

export const OnDarkBackground: Story = {
  render: (args) => (
    <div style={{ background: '#0a0a0a', padding: 24, borderRadius: 8, color: '#fff' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <CountryFlag {...args} country="us" />
        <CountryFlag {...args} country="cn" />
        <CountryFlag {...args} country="jp" />
        <CountryFlag {...args} country="de" />
        <CountryFlag {...args} country="fr" />
        <CountryFlag {...args} country="br" />
      </div>
    </div>
  ),
}

export const InText: Story = {
  render: (args) => (
    <div style={{ fontSize: 16, lineHeight: 1.8 }}>
      <p>
        The whereq platform serves data from the United States{' '}
        <CountryFlag {...args} country="us" size={16} />, China{' '}
        <CountryFlag {...args} country="cn" size={16} />, Japan{' '}
        <CountryFlag {...args} country="jp" size={16} />, the European Union{' '}
        <CountryFlag {...args} country="eu" alt="European Union" size={16} />, and many more regions.
      </p>
    </div>
  ),
}
