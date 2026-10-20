import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [vinext()],
  server: { host: '127.0.0.1', port: 4310, strictPort: true, allowedHosts: ['localhost'],
    watch: { usePolling: true },
    proxy: { '/api': { target: 'http://127.0.0.1:4313', changeOrigin: false } },
  },
});

