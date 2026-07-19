import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev-only proxy: forwards /api/* → local backend at https://localhost:3443/api/v1/*
    // In production on Vercel, vercel.json routes handle /api/v1/* directly.
    proxy: {
      '/api': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
  build: {
    // Output to the root /public folder so Vercel automatically serves
    // the static site without needing an outputDirectory in vercel.json.
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split large vendor libraries into separate cacheable chunks
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':     ['lucide-react'],
          'vendor-forms':  ['react-hook-form'],
          'vendor-i18n':   ['i18next', 'react-i18next'],
          'vendor-http':   ['axios'],
        },
      },
    },
  },
})
