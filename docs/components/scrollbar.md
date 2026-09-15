# Scrollbar

A scroll container with whereq.cc's thin, themeable scrollbar. It styles the **native**
scrollbar (no scroll hijacking), so keyboard, wheel, touch and accessibility all keep
working, with zero runtime scroll math.

> 🧪 Try every prop live in the [Storybook](/storybook/).

## Usage

```tsx
import { Scrollbar } from '@whereq/react'

;<Scrollbar style={{ maxHeight: 320 }}>
  <LongList />
</Scrollbar>
```

Auto-hide + a thicker rounded thumb:

```tsx
<Scrollbar autoHide size={8} theme="auto" style={{ maxHeight: '70vh' }}>
  <Content />
</Scrollbar>
```

Horizontal, with custom colours:

```tsx
<Scrollbar axis="horizontal" thumbColor="#17a2ae" thumbHoverColor="#0f7f89">
  <Row />
</Scrollbar>
```

## Props

`<Scrollbar>` extends `React.HTMLAttributes<HTMLDivElement>` — `className`, `style`,
`onScroll`, `ref`, and any other div prop pass through.

| Prop              | Type                                       | Default      | Description                                       |
| ----------------- | ------------------------------------------ | ------------ | ------------------------------------------------- |
| `axis`            | `'vertical' \| 'horizontal' \| 'both'`     | `'vertical'` | Which axis may scroll.                            |
| `size`            | `number`                                   | `6`          | Thumb/track thickness in px.                     |
| `radius`          | `number`                                   | `size / 2`   | Thumb corner radius in px.                       |
| `theme`           | `'auto' \| 'dark' \| 'light' \| 'neutral'` | `'auto'`     | Colour preset — see [Theming](/guide/theming).   |
| `thumbColor`      | `string`                                   | theme value  | Override the thumb colour.                       |
| `thumbHoverColor` | `string`                                   | theme value  | Override the thumb hover colour.                 |
| `trackColor`      | `string`                                   | `transparent`| Override the track colour.                       |
| `autoHide`        | `boolean`                                  | `false`      | Reveal the thumb only on hover / while scrolling.|
| `autoHideDelay`   | `number`                                   | `1000`       | ms the thumb stays after scrolling stops.       |
| `firefoxWidth`    | `'auto' \| 'thin' \| 'none'`               | `'thin'`     | Firefox `scrollbar-width` keyword.              |

## Notes

- **Auto-hide** fully hides the thumb until hover / active scroll on Chromium & Safari.
  Firefox keeps its thin scrollbar visible (it can't style per-state pseudo-elements).
- The component sets `overflow` for you based on `axis`; you only need to constrain the
  size (e.g. `maxHeight`).
