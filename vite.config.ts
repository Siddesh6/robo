import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'esp32-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.originalUrl || req.url || '';
          console.log(`[Proxy Debug] Incoming URL: "${url}" (original: "${req.originalUrl}", url: "${req.url}")`);
          
          if (url.startsWith('/esp32-api/')) {
            const match = url.match(/^\/esp32-api\/([\d\.]+)(.*)/);
            if (match) {
              const ip = match[1];
              const targetPath = match[2] || '/';
              
              console.log(`[Proxy API] ${req.method} forwarding -> http://${ip}${targetPath}`);
              const proxyReq = http.request({
                host: ip,
                port: 80,
                path: targetPath,
                method: req.method,
                headers: req.headers
              }, (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                proxyRes.pipe(res);
              });
              
              proxyReq.on('error', (err) => {
                console.error('[Proxy Error]:', err.message);
                res.statusCode = 502;
                res.end(`Bad Gateway: ${err.message}`);
              });
              
              req.pipe(proxyReq);
              return;
            }
          }
          
          if (url.startsWith('/esp32-stream/')) {
            const match = url.match(/^\/esp32-stream\/([\d\.]+)(.*)/);
            if (match) {
              const ip = match[1];
              const targetPath = match[2] || '/';
              
              console.log(`[Proxy Stream] ${req.method} forwarding -> http://${ip}:81${targetPath}`);
              const proxyReq = http.request({
                host: ip,
                port: 81,
                path: targetPath,
                method: req.method,
                headers: req.headers
              }, (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                proxyRes.pipe(res);
              });
              
              proxyReq.on('error', (err) => {
                console.error('[Proxy Stream Error]:', err.message);
                res.statusCode = 502;
                res.end(`Bad Gateway: ${err.message}`);
              });
              
              req.pipe(proxyReq);
              return;
            }
          }
          
          next();
        });
      }
    }
  ]
})
