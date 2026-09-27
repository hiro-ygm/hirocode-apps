// 各アプリのリリース状況を集めて release-status/index.html に書き出す（開発者用・非公開）。
// 使い方: npm run status（--no-open でブラウザを開かない）
// 前提: 各アプリのリポジトリが このリポジトリと同じ階層に ../<app id> として置かれている。

import { execFileSync } from 'node:child_process'
import { sign } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'
import { pickPendingVersion, renderHtml } from './release-status-lib.mjs'

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

// App Store Connect API（読み取りのみ）。キーは各アプリの eas.json（submit.production.ios）の設定を使う
const ascTokens = new Map()

function ascToken({ ascApiKeyId, ascApiKeyIssuerId, ascApiKeyPath }) {
  if (!ascTokens.has(ascApiKeyId)) {
    const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const data = `${b64({ alg: 'ES256', kid: ascApiKeyId, typ: 'JWT' })}.${b64({
      iss: ascApiKeyIssuerId,
      iat: now,
      exp: now + 10 * 60,
      aud: 'appstoreconnect-v1',
    })}`
    const signature = sign('sha256', Buffer.from(data), {
      key: readFileSync(ascApiKeyPath, 'utf8'),
      dsaEncoding: 'ieee-p1363',
    }).toString('base64url')
    ascTokens.set(ascApiKeyId, `${data}.${signature}`)
  }
  return ascTokens.get(ascApiKeyId)
}

async function ascGet(token, pathAndQuery) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${pathAndQuery}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.errors?.[0]?.detail ?? `HTTP ${res.status}`)
  return body
}

/** null = eas.json に ASC の設定がない */
async function readAsc(repoPath) {
  let key
  let bundleId
  try {
    key = JSON.parse(readFileSync(path.join(repoPath, 'eas.json'), 'utf8')).submit?.production?.ios
    bundleId = JSON.parse(readFileSync(path.join(repoPath, 'app.json'), 'utf8')).expo?.ios?.bundleIdentifier
  } catch {
    return null
  }
  if (!key?.ascApiKeyId || !key.ascApiKeyIssuerId || !key.ascApiKeyPath || !bundleId) return null

  try {
    const token = ascToken(key)
    const apps = await ascGet(token, `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId`)
    const app = apps.data?.find((a) => a.attributes.bundleId === bundleId)
    if (!app) return { error: `${bundleId} が見つからない` }
    const versions = await ascGet(
      token,
      `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=10&fields[appStoreVersions]=versionString,appVersionState,appStoreState,createdDate`,
    )
    const list = (versions.data ?? []).map((v) => ({
      version: v.attributes.versionString,
      state: v.attributes.appVersionState ?? v.attributes.appStoreState,
      createdDate: v.attributes.createdDate,
    }))
    return { pending: pickPendingVersion(list) }
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
      // レポート（release-status/index.html）から見た相対パス。file:// でも開発サーバーでも表示できる
      icon: existsSync(path.join(root, 'src/assets/icons', `${app.id}.png`)) ? `../src/assets/icons/${app.id}.png` : null,
      store: await readStore(app.appStoreUrl),
      asc: existsSync(repoPath) ? await readAsc(repoPath) : null,
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
