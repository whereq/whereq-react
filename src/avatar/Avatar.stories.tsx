import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import type { AvatarProps } from './types'

// A small inline SVG so the image stories work offline (no network in CI/Storybook).
const dataAvatar = (bg: string, letter: string) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${bg}"/><text x="50%" y="54%" font-family="sans-serif" font-size="56" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`,
  )

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: 'Ada Lovelace',
    size: 48,
    shape: 'circle',
    fit: 'cover',
    position: 'center',
    ringWidth: 1,
  },
  argTypes: {
    shape: { control: 'inline-radio', options: ['circle', 'rounded', 'square'] },
    status: { control: 'inline-radio', options: [undefined, 'online', 'offline', 'busy', 'away'] },
    size: { control: { type: 'range', min: 20, max: 128, step: 2 } },
    position: { control: 'text' },
    src: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A generic, accessible avatar. Renders an image, or gracefully falls back to name-derived initials on a deterministic colour. Supports shapes, an inset ring, a presence dot and head-cropping via object-position.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Avatar>

export const Image: Story = {
  args: { src: dataAvatar('#1C7ED6', 'A'), name: 'Ada Lovelace' },
  render: (args: AvatarProps) => <Avatar {...args} />,
}

export const Initials: Story = {
  args: { src: undefined, name: 'Grace Hopper' },
  render: (args: AvatarProps) => <Avatar {...args} />,
}

export const Shapes: Story = {
  render: (args: AvatarProps) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar {...args} shape="circle" name="Circle" />
      <Avatar {...args} shape="rounded" name="Rounded" />
      <Avatar {...args} shape="square" name="Square" />
    </div>
  ),
}

export const WithStatus: Story = {
  render: (args: AvatarProps) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar {...args} name="On" status="online" />
      <Avatar {...args} name="Away" status="away" />
      <Avatar {...args} name="Busy" status="busy" />
      <Avatar {...args} name="Off" status="offline" />
    </div>
  ),
}

export const Ring: Story = {
  args: { src: dataAvatar('#E8590C', 'Q'), name: 'QHaul', ring: '#e4e8ee', ringWidth: 2 },
  render: (args: AvatarProps) => <Avatar {...args} />,
}

export const Group: Story = {
  render: () => (
    <AvatarGroup size={40} max={3}>
      <Avatar src={dataAvatar('#1C7ED6', 'A')} name="Ada" />
      <Avatar src={dataAvatar('#2F9E44', 'B')} name="Ben" />
      <Avatar name="Cai Wen" />
      <Avatar name="Dee" />
      <Avatar name="Eli" />
    </AvatarGroup>
  ),
}
