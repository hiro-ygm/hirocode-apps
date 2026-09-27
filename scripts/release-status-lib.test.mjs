import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildWarnings, compareVersions, renderHtml, toVersion } from './release-status-lib.mjs'

const baseRepo = {
  tag: 'v1.1.0',
  tagDate: '2026-09-01',
  releaseBranches: [],
  developVersion: '1.1.0',
  commitsSinceTag: 0,
  lastCommitDate: '2026-09-01',
  dirty: 0,
}

function makeRow(overrides = {}) {
  return {
    id: 'app',
    repoPath: '/dev/app',
    site: { name: 'App', status: 'published', version: '1.1.0' },
    store: { version: '1.1.0', releaseDate: '2026-09-02', url: 'https://apps.apple.com/jp/app/id1' },
    repo: baseRepo,
    ...overrides,
  }
}

test('release/* で版を上げていれば据え置き info は出さない', () => {
  const row = makeRow({ repo: { ...baseRepo, commitsSinceTag: 3, releaseBranches: ['release/1.2.0'] } })
  assert.deepEqual(buildWarnings(row), [])
})

const messages = (row, level) =>
  buildWarnings(row)
    .filter((w) => !level || w.level === level)
    .map((w) => w.message)

test('toVersion はタグやブランチ名から版を取り出す', () => {
  assert.equal(toVersion('v1.2.3'), '1.2.3')
  assert.equal(toVersion('release/1.0.0'), '1.0.0')
  assert.equal(toVersion(null), null)
  assert.equal(toVersion('main'), null)
})

test('compareVersions は数値として比較する', () => {
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0)
  assert.ok(compareVersions('1.0.0', '1.0.1') < 0)
  assert.equal(compareVersions('2.0.0', '2.0.0'), 0)
  assert.equal(compareVersions('1.1', '1.1.0'), 0)
})

test('ストアの "1.1" はサイトの "1.1.0" と一致とみなす', () => {
  const row = makeRow({ store: { version: '1.1', releaseDate: null, url: 'https://apps.apple.com/jp/app/id1' } })
  assert.deepEqual(buildWarnings(row), [])
})

test('すべて揃っていれば注意なし', () => {
  assert.deepEqual(buildWarnings(makeRow()), [])
})

test('サイトの版がストアとずれていたら warn', () => {
  const row = makeRow({ site: { name: 'App', status: 'published', version: '1.0.0' } })
  assert.deepEqual(messages(row, 'warn'), ['サイトの版 1.0.0 がストアの版 1.1.0 と違う'])
})

test('ストア公開済みなのにサイトが審査中なら warn', () => {
  const row = makeRow({ site: { name: 'App', status: 'review', version: '1.1.0' } })
  assert.deepEqual(messages(row, 'warn'), ['ストアで公開済みだがサイトは「審査中」のまま'])
})

test('公開中なのにストアURLがなければ warn', () => {
  const row = makeRow({ store: null })
  assert.deepEqual(messages(row, 'warn'), ['サイトは「公開中」だがApp Store URLが未設定'])
})

test('審査中でストアURLがないのは正常', () => {
  const row = makeRow({ site: { name: 'App', status: 'review', version: '1.0.0' }, store: null })
  assert.deepEqual(buildWarnings(row), [])
})

test('タグがストアより古ければタグ付け漏れとして warn', () => {
  const row = makeRow({ repo: { ...baseRepo, tag: 'v1.0.0' } })
  assert.match(messages(row, 'warn')[0], /タグ付け漏れ/)
})

test('タグがストアより新しければ info（未反映）', () => {
  const row = makeRow({ repo: { ...baseRepo, tag: 'v1.2.0', developVersion: '1.2.0' } })
  assert.deepEqual(messages(row, 'warn'), [])
  assert.match(messages(row, 'info')[0], /まだストアに反映されていない/)
})

test('タグ以降のコミットがあり version が据え置きなら info', () => {
  const row = makeRow({ repo: { ...baseRepo, commitsSinceTag: 3 } })
  assert.deepEqual(messages(row, 'info'), [
    'develop に未リリースのコミットが 3 件あるが version は 1.1.0 のまま',
  ])
})

test('リポジトリが見つからなければ warn', () => {
  const row = makeRow({ repo: null })
  assert.deepEqual(messages(row, 'warn'), ['リポジトリが見つからない（/dev/app）'])
})

test('ストア取得エラーは warn にしてほかの比較はしない', () => {
  const row = makeRow({ store: { error: 'timeout' } })
  assert.deepEqual(messages(row), ['App Storeの取得に失敗: timeout'])
})

test('renderHtml は値をエスケープし、要確認件数を出す', () => {
  const row = makeRow({ site: { name: '<b>x</b>', status: 'published', version: '1.0.0' } })
  const html = renderHtml([row], 'now')
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'))
  assert.ok(!html.includes('<b>x</b>'))
  assert.ok(html.includes('要確認 1 件'))
})
