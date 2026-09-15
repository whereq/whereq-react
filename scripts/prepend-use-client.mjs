// Prepend the `"use client"` directive to the built bundles so the library works
// out-of-the-box as a client component in React Server Components / Next.js App
// Router. tsup's `banner` option is dropped by the bundler as a module-level
// directive, so we do it here as a reliable post-build step.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const DIRECTIVE = '"use client";\n'

for (const file of ['index.js', 'index.cjs']) {
  const path = join(dist, file)
  const src = await readFile(path, 'utf8')
  if (src.startsWith('"use client"') || src.startsWith("'use client'")) continue
  await writeFile(path, DIRECTIVE + src)
  console.log(`prepended "use client" → dist/${file}`)
}
