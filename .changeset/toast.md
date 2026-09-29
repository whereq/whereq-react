---
'@whereq/react': minor
---

Add `Toast` component (4th component in the lib).

`ToastProvider` wraps your app and holds the queue. `ToastViewport`
renders the queue at one of 6 positions (top-left/center/right,
bottom-left/center/right). `toast.notify / .success / .warning / .error /
.info / .custom / .update / .dismiss / .clear / .items` is the
imperative handle — works from anywhere (event handlers, async callbacks,
non-React code). The imperative handle is a Proxy that always reads
from the latest mounted api (no stale closure).

Includes 12 unit tests (lifecycle, push/dismiss/update/clear, maxVisible,
position assertions, accessibility role, xs-radius) and the metroUI xs
2px radius. Default auto-dismiss is 4000ms; pause on hover + focus for
a11y. Variants: default / success / warning / error.
