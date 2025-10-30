import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: false,
  target: 'es2022',
  outDir: 'build',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
      dts: '.d.ts',
    }
  },
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
