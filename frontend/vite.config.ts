import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward /api/* → https://localhost:3443/api/v1/*
      '/api': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false, // accept self-signed mkcert cert in dev
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
})

