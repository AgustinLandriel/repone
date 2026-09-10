import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // permite acceder desde el túnel de Cloudflare (host distinto a localhost) durante desarrollo
    allowedHosts: true,
  },
})
