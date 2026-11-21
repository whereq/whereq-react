---
'@whereq/react': patch
---

The Toast component (added in 0.5.0 work on `feat/toast`) was missing
from the main entry export. `src/index.ts` did not include `export * from
'./toast'`, so consumers who imported `import { ToastProvider, ToastViewport,
toast } from '@whereq/react'` got undefined.

Fix: add the missing re-export. Verified by re-running the full test
suite (73 tests) + a fresh build (ESM 33.62 KB, types 24.63 KB) which
now exposes ToastProvider, ToastViewport, toast, useToast and the Toast*
types at the package root.

Also bumps the version to 0.7.1.
