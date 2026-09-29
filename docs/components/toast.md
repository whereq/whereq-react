# Toast

A portal-style toast stack + imperative API. Wrap your app in `<ToastProvider>`, drop
a `<ToastViewport />` somewhere, and call `toast.error('Saved')` from anywhere — event
handlers, async callbacks, even non-React code. The handle is a Proxy that always reads
from the latest mounted api, so there's no stale-closure trap.

> 🧪 Try every prop live in the [Storybook](/storybook/).

## Usage

```tsx
import { ToastProvider, ToastViewport, toast } from '@whereq/react'

function App() {
  return (
    <ToastProvider>
      <ToastViewport position="bottom-right" />
      <YourRoutes />
    </ToastProvider>
  )
}

// later, anywhere in your code:
toast.notify('Hello world')
toast.error('Save failed', { description: 'Try again' })
toast.success('Saved', {
  action: { label: 'Undo', onClick: () => restoreFromBackup() },
})
toast.update(id, { title: 'Saved ✓' })
toast.dismiss(id)
toast.clear()
```

Auto-dismiss with a 7s ceiling:

```tsx
toast.notify('Heads up', { duration: 7000 })
```

Disable auto-dismiss entirely (the toast stays until manually dismissed):

```tsx
toast.notify('Action required', { duration: 0 })
```

## Variants

Each variant pairs a coloured icon, border, and tinted background:

| Variant   | Used for                              | Default colour (token) |
| --------- | ------------------------------------- | ------------------------ |
| `default` | Neutral informational notification | `var(--text)`            |
| `success` | Confirmation / completion            | `var(--up)`              |
| `warning` | Heads-up / require attention        | `var(--nova)`            |
| `error`   | Failure / block / interrupt          | `var(--down)`            |
| `info`     | Same surface as `default`, neutral   | `var(--text)`            |

The `info` variant is an alias for `default` — the names matter for
readability at the call site (`toast.info('…')` reads better than `toast.notify('…')`
when the content is informational).

## Positions

```tsx
<ToastViewport position="bottom-right" />  // default
<ToastViewport position="bottom-left" />
<ToastViewport position="bottom-center" />
<ToastViewport position="top-right" />
<ToastViewport position="top-left" />
<ToastViewport position="top-center" />
```

## Props

### `<ToastProvider>`

| Prop       | Type        | Default | Description                                          |
| ---------- | ----------- | ------- | ---------------------------------------------------- |
| `children` | `ReactNode` | —       | Your app. The provider renders nothing itself.        |

### `<ToastViewport>`

Extends `React.HTMLAttributes<HTMLDivElement>` — `className`, `style`, `ref`, and any other
div prop pass through.

| Prop         | Type                                                              | Default          | Description                                              |
| ------------ | ----------------------------------------------------------------- | ---------------- | -------------------------------------------------------- |
| `position`   | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | Stack corner.                                          |
| `maxVisible` | `number`                                                          | `5`              | FIFO-drop the oldest when the queue exceeds this size.    |
| `ariaLive`   | `'polite' \| 'assertive' \| 'off'`                                | `'polite'`        | `aria-live` politeness for the viewport region.         |
| `children`   | omitted — pass other DOM attrs as usual                           |                  |                                                          |

### `toast.*` imperative handle

| Method                         | Returns   | Description                                                              |
| ------------------------------ | --------- | ------------------------------------------------------------------------ |
| `toast.notify(title, opts?)`    | `string` (id) | Default-variant toast.                              |
| `toast.success(title, opts?)`   | `string` (id) | Confirmation-style toast.                           |
| `toast.warning(title, opts?)`   | `string` (id) | Heads-up / soft warning.                            |
| `toast.error(title, opts?)`     | `string` (id) | Failure / hard error.                               |
| `toast.info(title, opts?)`      | `string` (id) | Informational — same surface as `default`.           |
| `toast.custom(title, opts?)`   | `string` (id) | Escape hatch for non-string bodies.                  |
| `toast.update(id, patch)`      | `boolean`     | Update an existing toast; returns false if absent.    |
| `toast.dismiss(id?)`           | `boolean`     | Remove one (by id) or all (no id); false if absent.   |
| `toast.clear()`                | `void`       | Empty the queue.                                      |
| `toast.items` (getter)         | `readonly ToastItem[]` | Read-only snapshot of the current stack.     |

`opts` is a `ToastOptions`:

| Option      | Type                                                | Default | Description                                              |
| ----------- | --------------------------------------------------- | ------- | -------------------------------------------------------- |
| `id`        | `string`                                            | auto    | Stable id; updates / dismisses target by id.             |
| `description` | `ReactNode`                                     | —       | Secondary line (string or JSX).                         |
| `duration`  | `number` (ms)                                       | `4000`  | Auto-dismiss delay. `0` disables.                       |
| `position`  | `ToastPosition`                                    | inherit | Per-toast override of the viewport position.            |
| `action`    | `{ label: string; onClick: () => void }`            | —       | Primary action button (e.g. "Undo", "Retry").            |

The `custom` form additionally accepts `variant` in `opts`:

```tsx
toast.custom(<span>Custom <strong>JSX</strong> body</span>, { variant: 'warning' })
```

## Accessibility

- The viewport is a `<div role="region" aria-live="polite" aria-label="Notifications">`.
- `error` toasts are rendered with `role="alert"` so screen-readers interrupt
  immediately. All other variants are `role="status"`.
- Pause-on-hover + pause-on-focus suspend the auto-dismiss timer so users
  can read longer messages without racing the close button.
- Each toast has a labelled dismiss button (`aria-label="Dismiss"`).
- `Tab` focuses the dismiss button; `Enter` / `Space` closes it.

## Notes

- **Module-level singleton** — `toast` is a Proxy whose traps read from the
  currently-mounted `ToastProvider` api. Calling `toast.notify(...)` before
  any provider mounts throws a clear error.
- **SSR-safe** — the queue starts empty, so the first render emits zero
  toasts. Hydration matches.
- **metroUI xs** — each card uses 2px border-radius, matching the rest of
  the whereq family (Tag, CountryFlag, Avatar, Scrollbar).
- **Re-mount safe** — the imperative handle rebinds to the latest api on every
  mount, so HMR / React StrictMode dev double-mounts stay consistent.

## Tests

`src/toast/Toast.test.tsx` covers lifecycle (push, dismiss, update, clear),
maxVisible FIFO drop, position assertions, accessibility roles
(`status` vs `alert`), and the xs-radius visual standard.
