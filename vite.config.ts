import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'build',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/node_modules/],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
