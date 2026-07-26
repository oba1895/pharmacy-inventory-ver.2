import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // xlsxを起動時に事前バンドルし、React重複読み込み（Invalid hook call）を防ぐ
  optimizeDeps: {
    include: ['xlsx'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0', // LAN上の全デバイス（iPad等）からのアクセスを許可
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
