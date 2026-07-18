import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/esp32-api': {
        target: 'http://localhost', // dummy target, overridden by router
        changeOrigin: true,
        router: (req) => {
          const match = req.url.match(/^\/esp32-api\/([\d\.]+)/);
          if (match) {
            return `http://${match[1]}`;
          }
          return 'http://10.169.247.176'; // default fallback IP
        },
        rewrite: (path) => path.replace(/^\/esp32-api\/[\d\.]+/, ''),
      },
      '/esp32-ws': {
        target: 'ws://localhost',
        ws: true,
        router: (req) => {
          const match = req.url.match(/^\/esp32-ws\/([\d\.]+)/);
          if (match) {
            return `ws://${match[1]}`;
          }
          return 'ws://10.169.247.176'; // default fallback IP
        },
        rewrite: (path) => path.replace(/^\/esp32-ws\/[\d\.]+/, ''),
      },
      '/esp32-stream': {
        target: 'http://localhost',
        changeOrigin: true,
        router: (req) => {
          const match = req.url.match(/^\/esp32-stream\/([\d\.]+)/);
          if (match) {
            return `http://${match[1]}:81`;
          }
          return 'http://10.169.247.176:81'; // default fallback IP
        },
        rewrite: (path) => path.replace(/^\/esp32-stream\/[\d\.]+/, ''),
      }
    }
  }
})
