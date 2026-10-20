import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Cấu hình Vite với hỗ trợ Ngrok
 * 
 * Cách sử dụng với Ngrok:
 * 1. Tạo file .env trong thư mục frontend với nội dung:
 *    VITE_NGROK_URL=https://your-ngrok-url.ngrok.io
 * 
 * 2. Hoặc set environment variable:
 *    export VITE_NGROK_URL=https://your-ngrok-url.ngrok.io
 * 
 * 3. Khởi động ngrok cho backend:
 *    ngrok http 5000
 * 
 * 4. Copy ngrok URL và set vào VITE_NGROK_URL
 * 
 * Lưu ý: Proxy sẽ tự động trỏ đến ngrok URL nếu VITE_NGROK_URL được set
 */
export default defineConfig(({ mode }) => {
  // Lấy ngrok URL từ environment variable
  const NGROK_URL = process.env.VITE_NGROK_URL
  // Backend URL mặc định (localhost hoặc có thể override)
  const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000'
  
  // Ưu tiên sử dụng ngrok URL nếu có, nếu không thì dùng backend URL
  const proxyTarget = NGROK_URL || BACKEND_URL

  console.log(`🚀 Vite proxy target: ${proxyTarget}`)
  if (NGROK_URL) {
    console.log(`📡 Using Ngrok URL: ${NGROK_URL}`)
  }

  return {
    base: './',
    plugins: [react()],
    // Tối ưu hóa build
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Tách vendor chunks để tối ưu caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'model-viewer': ['@google/model-viewer'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Tăng limit để tránh warning không cần thiết
    },
    // Tối ưu hóa dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@google/model-viewer',
      ],
      exclude: [],
    },
    server: {
      host: '0.0.0.0', // Cho phép truy cập từ mạng LAN
      port: 5173,
      // Cho phép tất cả các ngrok domains
      allowedHosts: [
        '.ngrok.io',
        '.ngrok-free.app',
        '.ngrok.app',
        'localhost',
        '127.0.0.1',
      ],
      // Hoặc có thể set 'all' để cho phép tất cả hosts (ít bảo mật hơn, chỉ dùng trong development)
      // allowedHosts: mode === 'development' ? 'all' : ['.ngrok.io', '.ngrok-free.app', '.ngrok.app'],
      strictPort: false, // Cho phép dùng port khác nếu port 5173 bị chiếm
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true, // Quan trọng cho ngrok
          secure: false, // Cho phép HTTPS từ ngrok (ngrok dùng self-signed cert)
          ws: true, // Hỗ trợ WebSocket nếu cần
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('❌ Proxy error:', err.message)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Log proxy requests trong development
              if (mode === 'development') {
                console.log(`🔄 Proxying: ${req.method} ${req.url} -> ${proxyTarget}`)
              }
            })
          },
        }
      }
    },
  }
})
