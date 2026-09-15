# Getting Started

## Installation

::: code-group

```bash [npm]
npm install @whereq/react
```

```bash [pnpm]
pnpm add @whereq/react
```

```bash [yarn]
yarn add @whereq/react
```

:::

`react >= 18` is a peer dependency.

## Your first Scrollbar

`<Scrollbar>` is a drop-in scroll container. Give it a height (or let a flex parent
constrain it) and it renders the thin whereq.cc scrollbar:

```tsx
import { Scrollbar } from '@whereq/react'

export function Sidebar() {
  return (
    <Scrollbar style={{ maxHeight: 320 }}>
      <nav>{/* tall content */}</nav>
    </Scrollbar>
  )
}
```

The tiny base stylesheet is injected automatically the first time a `<Scrollbar>`
mounts — there's no CSS file to import.

## Style the whole app

To apply the look to **every** native scrollbar (the whereq.cc app-wide style), mount
`<GlobalScrollbar>` once near your root:

```tsx
import { GlobalScrollbar } from '@whereq/react'

export function App() {
  return (
    <>
      <GlobalScrollbar theme="auto" size={6} />
      {/* … */}
    </>
  )
}
```

## Frameworks

- **Next.js (App Router)** — the package ships a `"use client"` boundary, so you can
  import it in a Server Component without wrapping it yourself.
- **Vite / CRA / Remix** — no configuration needed.

Next: the [Scrollbar API](/components/scrollbar) and [Theming](/guide/theming).
