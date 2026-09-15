import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  external: ['react', 'react-dom'],
  // The components use hooks + the DOM, so they must be client components for
  // React Server Components (Next.js App Router). The `"use client"` directive is
  // prepended by scripts/prepend-use-client.mjs after the bundle step — a tsup
  // `banner` gets stripped by the bundler as a "module level directive".
})
