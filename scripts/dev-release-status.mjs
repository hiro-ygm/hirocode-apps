// 開発サーバー（npm run dev）でだけ /release-status/ を提供するViteプラグイン。
// アクセスのたびに release-status.mjs を実行してレポートを作り直し、その結果を返す。
// 本番ビルドには含まれない（apply: 'serve'）。

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(root, 'scripts', 'release-status.mjs')
const report = path.join(root, 'release-status', 'index.html')

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function devReleaseStatus() {
  return {
    name: 'dev-release-status',
    apply: 'serve',
    config() {
      // 再生成のたびに開いているページがリロードされないよう監視から外す
      return { server: { watch: { ignored: ['**/release-status/**'] } } }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname !== '/release-status' && pathname !== '/release-status/') return next()

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        try {
          await run(process.execPath, [script, '--no-open'], { cwd: root, timeout: 60_000 })
          res.end(await readFile(report, 'utf8'))
        } catch (error) {
          const detail = error.stderr?.toString().trim() || error.message
          server.config.logger.error(`[release-status] ${detail}`)
          res.statusCode = 500
          res.end(
            `<!doctype html><meta charset="utf-8"><title>Release Status</title>` +
              `<h1>レポートの生成に失敗しました</h1><pre>${escapeHtml(detail)}</pre>`,
          )
        }
      })
    },
  }
}
