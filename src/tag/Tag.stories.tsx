import type { Meta, StoryObj } from '@storybook/react'
import { Tag, TagImpl } from './Tag'

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: {
    variant: 'subtle',
    size: 'sm',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['subtle', 'solid', 'dot', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    dotColor: { control: 'color' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A generic inline tag / chip / pill. Variants: subtle (outlined, dim), solid (filled accent), dot (leading dot + label), link (hover-able navigation chip). Renders as <span> by default; as="a"/"button" supported for interactive use cases.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Tag>

export const Subtle: Story = { args: { children: 'Public · daily' } }
export const Solid: Story = { args: { variant: 'solid', children: 'Active' } }
export const SolidColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag variant="solid">Default (accent)</Tag>
      <Tag variant="solid" solidColor="up">Live</Tag>
      <Tag variant="solid" solidColor="down">Down</Tag>
      <Tag variant="solid" solidColor="nova">Nova</Tag>
    </div>
  ),
}
export const Dot: Story = {
  args: { variant: 'dot', dotColor: 'var(--up)', children: 'Operational' } }
export const Link: Story = {
  render: (args) => (
    <TagImpl<'a'> {...args} variant="link" as="a" href="#">← Back to Finance</TagImpl>
  ),
}
export const Md: Story = { args: { size: 'md', children: 'Larger' } }
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag {...args} variant="subtle">Public</Tag>
      <Tag {...args} variant="subtle">Daily</Tag>
      <Tag {...args} variant="solid">Active</Tag>
      <Tag {...args} variant="dot" dotColor="var(--up)">Live</Tag>
      <Tag {...args} variant="dot" dotColor="var(--down)">Stale</Tag>
      <TagImpl<'a'> {...args} variant="link" as="a" href="#">Back</TagImpl>
      <Tag {...args} size="md" variant="solid">Larger</Tag>
    </div>
  ),
}
