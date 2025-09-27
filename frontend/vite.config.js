import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    // 预热常用文件
    warmup: {
      clientFiles: [
        './src/main.js',
        './src/App.vue',
        './src/router/index.js',
        './src/stores/auth.store.js'
      ]
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild', // 使用esbuild代替terser，更快且无需额外依赖
    
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'utils-vendor': ['axios', 'dayjs'],
          'stores': [
            './src/stores/auth.store.js',
            './src/stores/article.store.js',
            './src/stores/app.store.js',
            './src/stores/ui.store.js'
          ]
        },
        // 文件命名优化
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('node_modules')) {
              return 'vendor/[name]-[hash].js'
            }
            if (facadeModuleId.includes('components')) {
              return 'components/[name]-[hash].js'
            }
            if (facadeModuleId.includes('views')) {
              return 'views/[name]-[hash].js'
            }
          }
          return 'chunks/[name]-[hash].js'
        }
      }
    },
    
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000
  },
  
  // 依赖优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios', 'dayjs'],
    exclude: ['@sentry/vue']
  }
})