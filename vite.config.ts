import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   server: {
    proxy: {
      '/api/safaricom': {
        target: 'https://sandbox.safaricom.co.ke',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/safaricom/, ''),
      },
      '/api/safaricom-prod': {
        target: 'https://api.safaricom.co.ke',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/safaricom-prod/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['fflate', 'html2canvas']
    }
  }
});
