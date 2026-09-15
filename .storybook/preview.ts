import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0d1117' },
        { name: 'light', value: '#f5f3ef' },
      ],
    },
    controls: {
      matchers: { color: /(background|color)$/i },
      expanded: true,
    },
  },
}

export default preview
