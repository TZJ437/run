import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// GitHub Pages 项目站点部署在 /<repo>/ 路径下，通过 VITE_BASE 环境变量注入
// 本地开发或部署到根域名时保持为 '/'
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-512.svg', 'icon-maskable-512.svg'],
      manifest: {
        name: 'LightGlass · 轻玻璃',
        short_name: 'LightGlass',
        description: '一款极简液态玻璃风格的生活小工具：随手记、节气、时钟、番茄钟',
        theme_color: '#a78bfa',
        background_color: '#f5f3ff',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        icons: [
          {
            src: 'icon-512.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 离线缓存策略：应用外壳走 CacheFirst，API 请求走 NetworkFirst
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
