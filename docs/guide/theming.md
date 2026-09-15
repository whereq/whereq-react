# Theming

Colours are driven by CSS custom properties, so you can theme with **props** or with
plain **CSS** — whichever fits your setup.

## Theme presets

| `theme`     | Behaviour                                                                             |
| ----------- | ------------------------------------------------------------------------------------- |
| `auto` (default) | Uses the CSS [`light-dark()`](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark) function — matches whereq.cc exactly on both schemes. |
| `dark`      | Explicit whereq.cc dark palette (translucent white thumb).                            |
| `light`     | Explicit whereq.cc light palette (translucent black thumb).                           |
| `neutral`   | A translucent grey visible on any background, even without a declared `color-scheme`. |

```tsx
<Scrollbar theme="dark" />
<Scrollbar theme="neutral" />
```

> For `theme="auto"` to adapt, declare a `color-scheme` on your page, e.g.
> `:root { color-scheme: light dark }`. If none is declared it falls back to the light value.

## Per-instance overrides

```tsx
<Scrollbar
  size={8}
  radius={4}
  thumbColor="rgba(23, 162, 174, 0.5)"
  thumbHoverColor="rgba(23, 162, 174, 0.8)"
  trackColor="transparent"
/>
```

## Theming with CSS variables

The component reads these variables, so you can theme globally in your stylesheet:

```css
.wq-scrollbar {
  --wq-sb-size: 6px;
  --wq-sb-radius: 3px;
  --wq-sb-thumb: rgba(255, 255, 255, 0.1);
  --wq-sb-thumb-hover: rgba(255, 255, 255, 0.2);
  --wq-sb-track: transparent;
}
```

## Global scrollbars

`GlobalScrollbar` / `injectGlobalScrollbarStyles` accept the same options and style
every native scrollbar on the page:

```tsx
<GlobalScrollbar theme="auto" size={6} />
```

```ts
import { injectGlobalScrollbarStyles } from '@whereq/react'

const cleanup = injectGlobalScrollbarStyles({ theme: 'dark', size: 6, selector: 'html' })
// cleanup() removes the injected styles
```
