import { defineConfig } from 'vitepress'

// Deployed to GitHub Pages at https://whereq.github.io/whereq-react/
export default defineConfig({
  title: '@whereq/react',
  description: "WhereQ's open-source React component library — lightweight, accessible, themeable.",
  base: '/whereq-react/',
  cleanUrls: true,
  lastUpdated: true,
  // Storybook is built separately and deployed alongside the docs at /storybook/,
  // so VitePress can't resolve those links at build time.
  ignoreDeadLinks: [/^\/storybook\//, '/storybook/'],
  head: [['meta', { name: 'theme-color', content: '#17a2ae' }]],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Components', link: '/components/scrollbar' },
      { text: 'Storybook', link: '/storybook/' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@whereq/react' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is @whereq/react?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Scrollbar', link: '/components/scrollbar' },
          { text: 'Avatar', link: '/components/avatar' },
        ],
      },
      {
        text: 'Guides',
        items: [{ text: 'Theming', link: '/guide/theming' }],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/whereq/whereq-react' }],
    footer: { message: 'Released under the MIT License.', copyright: '© 2026 WhereQ' },
    search: { provider: 'local' },
  },
})
