import { defineConfig } from 'tsup'
import { execSync } from 'child_process'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  treeshake: true,
  splitting: false,
  bundle: true,
  external: ['crypto', 'eventsource-client'],
  onSuccess: async () => {
    execSync('tsc -p tsconfig.declaration.json')
  }
}) 