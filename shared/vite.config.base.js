import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Shared Vite configuration factory for all MSP frontend applications
 * @param {number} port - The port number for the dev server
 * @param {object} options - Additional configuration options
 */
export function createViteConfig(port, options = {}) {
  return defineConfig({
    plugins: [react()],
    server: {
      port,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      },
      ...options.server
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      ...options.build
    },
    resolve: {
      alias: {
        '@shared': new URL('../../shared/src', import.meta.url).pathname,
        ...options.resolve?.alias
      },
      ...options.resolve
    },
    ...options
  })
}