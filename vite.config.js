import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    // 代理到云托管 Express API（开发环境）
    proxy: {
      '/api': {
        target: 'https://express-z2ap-252828-7-1420911382.sh.run.tcloudbase.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
