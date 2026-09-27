import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' で相対パス出力にし、GitHub Pagesのプロジェクトサイト（/<repo>/）でも
// カスタムドメイン（/）でも同じビルドで動くようにしている。
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        privacy: 'privacy/index.html',
      },
    },
  },
})
