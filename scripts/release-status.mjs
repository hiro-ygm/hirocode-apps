// 各アプリのリリース状況を集めて release-status/index.html に書き出す（開発者用・非公開）。
// 使い方: npm run status（--no-open でブラウザを開かない）
// 前提: 各アプリのリポジトリが このリポジトリと同じ階層に ../<app id> として置かれている。

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'
import { renderHtml } from './release-status-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'release-status')

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function hasRef(cwd, ref) {
  try {
    git(cwd, ['rev-parse', '--verify', '--quiet', ref])
    return true
  } catch {
    return false
  }
}

function readRepo(repoPath) {
  if (!existsSync(path.join(repoPath, '.git'))) return null
  try {
    const tag = git(repoPath, ['tag', '--list', 'v*', '--sort=-v:refname']).split('\n')[0] || null
    const develop = hasRef(repoPath, 'develop') ? 'develop' : 'HEAD'
    const releaseBranches = [
      ...new Set(
        git(repoPath, ['branch', '-a', '--format=%(refname:short)', '--list', 'release/*', '*/release/*'])
          .split('\n')
          .filter(Boolean)
          .map((b) => b.replace(/^[^/]+\/(?=release\/)/, '')),
      ),
    ]
    let developVersion = null
    try {
      developVersion = JSON.parse(git(repoPath, ['show', `${develop}:app.json`])).expo?.version ?? null
    } catch {
      // app.json がないリポジトリは version 不明として扱う
    }
    return {
      tag,
      tagDate: tag ? git(repoPath, ['log', '-1', '--format=%cs', tag]) : null,
      releaseBranches,
      developVersion,
      commitsSinceTag: Number(git(repoPath, ['rev-list', '--count', tag ? `${tag}..${develop}` : develop])),
      lastCommitDate: git(repoPath, ['log', '-1', '--format=%cs', develop]),
      dirty: git(repoPath, ['status', '--porcelain']).split('\n').filter(Boolean).length,
    }
  } catch (error) {
    return { error: error.stderr?.toString().trim() || error.message }
  }
}

async function readStore(appStoreUrl) {
  const id = appStoreUrl?.match(/id(\d+)/)?.[1]
  if (!id) return null
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=jp`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const result = (await res.json()).results?.[0]
    if (!result) return { error: 'ストアに見つからない' }
    return {
      version: result.version,
      releaseDate: result.currentVersionReleaseDate?.slice(0, 10) ?? null,
      url: appStoreUrl,
    }
  } catch (error) {
    return { error: error.message }
  }
}

const { module } = await runnerImport('/src/data/apps.ts', { root, configFile: false, logLevel: 'error' })

const rows = await Promise.all(
  module.apps.map(async (app) => {
    const repoPath = path.resolve(root, '..', app.id)
    return {
      id: app.id,
      repoPath,
      site: { name: app.name, status: app.status, version: app.version ?? null },
      store: await readStore(app.appStoreUrl),
      repo: readRepo(repoPath),
    }
  }),
)

mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'index.html')
writeFileSync(outFile, renderHtml(rows, new Date().toLocaleString('ja-JP')))
console.log(`wrote ${path.relative(root, outFile)}`)

if (!process.argv.includes('--no-open') && process.platform === 'darwin') {
  execFileSync('open', [outFile])
}
