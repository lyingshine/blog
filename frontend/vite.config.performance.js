import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // 支持旧版浏览器
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    // 打包分析
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  // 构建优化
  build: {
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 生成 sourcemap
    sourcemap: true,
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // Vue 核心
          'vue-vendor': ['vue', 'vue-router'],
          
          // 工具库
          'utils-vendor': ['axios', 'dayjs'],
          
          // UI 组件
          'ui-components': [
            './src/components/ArticleCard.vue',
            './src/components/CommentSection.vue',
            './src/components/UserProfile.vue'
          ],
          
          // 服务层
          'services': [
            './src/services/auth.service.js',
            './src/services/article.service.js',
            './src/services/app.service.js'
          ],
          
          // 状态管理
          'stores': [
            './src/stores/auth.store.js',
            './src/stores/article.store.js',
            './src/stores/app.store.js',
            './src/stores/ui.store.js'
          ]
        },
        
        // 文件命名
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
        },
        
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css'
          }
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.name)) {
            return 'images/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000
  },
  
  // 开发服务器优化
  server: {
    // 预热常用文件
    warmup: {
      clientFiles: [
        './src/main.js',
        './src/App.vue',
        './src/router/index.js'
      ]
    }
  },
  
  // 依赖优化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'axios',
      'dayjs'
    ],
    exclude: [
      '@sentry/vue'
    ]
  }
})