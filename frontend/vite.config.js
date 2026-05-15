import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // Pre-bundle Firebase completely — prevents "d is not defined" in dev mode
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/analytics',
    ],
    esbuildOptions: {
      // Firebase uses top-level await and modern syntax
      target: 'es2020',
    },
  },

  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
