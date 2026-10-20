import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite builds the React front end.
 * During development, API calls are proxied to the Node server on port 3000
 * so the browser only ever talks to a single origin.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Keep the original Host header so the server's same-origin (CSRF) check passes.
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
