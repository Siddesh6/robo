import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/esp32-api': {
        target: 'http://10.169.247.195',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32-api/, ''),
      },
      '/esp32-ws': {
        target: 'ws://10.169.247.195',
        ws: true,
        rewrite: (path) => path.replace(/^\/esp32-ws/, ''),
      },
      '/esp32-stream': {
        target: 'http://10.169.247.195:81',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32-stream/, ''),
      }
    }
  }
})
