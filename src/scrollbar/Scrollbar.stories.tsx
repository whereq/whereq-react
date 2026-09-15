import type { Meta, StoryObj } from '@storybook/react'
import { Scrollbar } from './Scrollbar'
import type { ScrollbarProps } from './types'

const filler = (rows = 40) => (
  <div style={{ padding: 12 }}>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        style={{
          padding: '10px 12px',
          marginBottom: 8,
          borderRadius: 8,
          background: 'color-mix(in srgb, currentColor 8%, transparent)',
        }}
      >
        Row {i + 1}
      </div>
    ))}
  </div>
)

const meta: Meta<typeof Scrollbar> = {
  title: 'Components/Scrollbar',
  component: Scrollbar,
  tags: ['autodocs'],
  args: {
    size: 6,
    theme: 'auto',
    axis: 'vertical',
    autoHide: false,
    autoHideDelay: 1000,
    style: { maxHeight: 320, width: 360 },
  },
  argTypes: {
    theme: { control: 'inline-radio', options: ['auto', 'dark', 'light', 'neutral'] },
    axis: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
    size: { control: { type: 'range', min: 2, max: 20, step: 1 } },
    autoHideDelay: { control: { type: 'range', min: 200, max: 3000, step: 100 } },
    firefoxWidth: { control: 'inline-radio', options: ['thin', 'auto', 'none'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "whereq.cc's thin, themeable scrollbar as a component. It styles the native scrollbar — no scroll hijacking — so keyboard, wheel, touch and accessibility keep working.",
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Scrollbar>

export const Default: Story = {
  render: (args: ScrollbarProps) => <Scrollbar {...args}>{filler()}</Scrollbar>,
}

export const AutoHide: Story = {
  args: { autoHide: true },
  render: (args: ScrollbarProps) => <Scrollbar {...args}>{filler()}</Scrollbar>,
}

export const ThickRounded: Story = {
  args: { size: 12, radius: 6, theme: 'dark' },
  render: (args: ScrollbarProps) => <Scrollbar {...args}>{filler()}</Scrollbar>,
}

export const CustomColors: Story = {
  args: { size: 8, thumbColor: 'rgba(23,162,174,.55)', thumbHoverColor: 'rgba(23,162,174,.85)' },
  render: (args: ScrollbarProps) => <Scrollbar {...args}>{filler()}</Scrollbar>,
}

export const Horizontal: Story = {
  args: { axis: 'horizontal', style: { width: 360, maxWidth: 360, whiteSpace: 'nowrap' } },
  render: (args: ScrollbarProps) => (
    <Scrollbar {...args}>
      <div style={{ display: 'inline-flex', gap: 8, padding: 12 }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              minWidth: 96,
              height: 96,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 8,
              background: 'color-mix(in srgb, currentColor 8%, transparent)',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </Scrollbar>
  ),
}
