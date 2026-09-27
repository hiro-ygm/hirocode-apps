import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// base: './' で相対パス出力にし、GitHub Pagesのプロジェクトサイト（/<repo>/）でも
// カスタムドメイン（/）でも同じビルドで動くようにしている。
export default defineConfig(({ command, mode }) => {
  // OGPの og:url / og:image は絶対URLが必要。未設定だと相対パスになりSNSで画像が出ない
  if (command === 'build' && !loadEnv(mode, '.', 'VITE_').VITE_SITE_URL) {
    console.warn('[warn] VITE_SITE_URL が未設定のため、OGPのURLが相対パスになります')
  }

  return {
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
  }
})
