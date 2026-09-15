---
layout: home

hero:
  name: '@whereq/react'
  text: "WhereQ's React component library"
  tagline: Lightweight, accessible, themeable UI primitives — starting with a beautiful thin Scrollbar.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Scrollbar
      link: /components/scrollbar
    - theme: alt
      text: GitHub
      link: https://github.com/whereq/whereq-react

features:
  - icon: 🪶
    title: Tiny & dependency-free
    details: Native scrollbars, a few bytes of CSS, zero runtime scroll math. ~2 kB gzipped.
  - icon: 🎨
    title: Themeable
    details: Light / dark / auto presets, or full control via colour props and CSS variables.
  - icon: ♿
    title: Accessible & native
    details: Real scrollbars — keyboard, wheel, touch and screen readers all keep working.
  - icon: 🧩
    title: SSR-safe & RSC-ready
    details: Ships a "use client" boundary; styles inject before paint. ESM + CJS + types.
---

## Why @whereq/react?

The `Scrollbar` was extracted from [whereq.cc](https://whereq.cc), our privacy-first
photo gallery. Instead of a JavaScript overlay that hijacks the wheel, it styles the
**native** scrollbar — so everything the browser gives you for free (keyboard paging,
momentum, accessibility) simply keeps working, while the thin, themeable look stays
consistent across your app.

This is the first component in WhereQ's open-source frontend library. More primitives
are on the way.

```bash
npm install @whereq/react
```

```tsx
import { Scrollbar } from '@whereq/react'

;<Scrollbar style={{ maxHeight: 320 }}>
  <LongList />
</Scrollbar>
```
