import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 使用 SWC 版本的 React 插件以获得更好的性能
    react(),
    // Tailwind CSS v4 官方 Vite 插件
    tailwindcss(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    // Vite 7 默认使用 'baseline-widely-available'
    // 如需自定义，可以指定：
    // target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'konva': ['konva', 'react-konva'],
        }
      }
    },
  },
  
  server: {
    port: 3000,
    open: true,
  }
})