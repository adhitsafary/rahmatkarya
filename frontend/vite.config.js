import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: './', // relative base so it works on any cPanel subfolder or domain root
  server: {
    proxy: {
      '/api.php': {
        target: 'http://localhost/ASLI/Projectk2',
        changeOrigin: true
      },
      '/auth.php': {
        target: 'http://localhost/ASLI/Projectk2',
        changeOrigin: true
      },
      '/export.php': {
        target: 'http://localhost/ASLI/Projectk2',
        changeOrigin: true
      }
    }
  }
})
