import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Temporary local alias for development before npm publish
  resolve: {
    alias: {
      '@mfestack/core': path.resolve(__dirname, '../../packages/core/build'),
      '@mfestack/react': path.resolve(__dirname, '../../packages/react/build'),
    },
  },
})
