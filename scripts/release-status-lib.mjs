// リリース状況レポートの判定とHTML生成（副作用なし）。
// データ収集は release-status.mjs が行う。

const statusLabels = {
  published: '公開中',
  review: '審査中',
  development: '開発中',
}

/** "v1.2.0" / "release/1.2.0" などから "1.2.0" を取り出す */
export function toVersion(ref) {
  if (!ref) return null
  const match = ref.match(/(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

/**
 * 1行分の注意点を返す。
 * level: warn = 食い違い（要対応） / info = 知っておくと良い状態
 */
export function buildWarnings(row) {
  const warnings = []
  const warn = (message) => warnings.push({ level: 'warn', message })
  const info = (message) => warnings.push({ level: 'info', message })

  const { site, store, repo } = row
  const tagVersion = toVersion(repo?.tag)

  if (store?.error) warn(`App Storeの取得に失敗: ${store.error}`)
  if (!repo) {
    warn(`リポジトリが見つからない（${row.repoPath}）`)
  } else if (repo.error) {
    warn(`gitの読み取りに失敗: ${repo.error}`)
  }

  const storeVersion = store && !store.error ? store.version : null

  if (site.status === 'published' && !store) {
    warn('サイトは「公開中」だがApp Store URLが未設定')
  }
  if (storeVersion && site.status !== 'published') {
    warn(`ストアで公開済みだがサイトは「${statusLabels[site.status]}」のまま`)
  }
  if (storeVersion && site.version && compareVersions(site.version, storeVersion) !== 0) {
    warn(`サイトの版 ${site.version} がストアの版 ${storeVersion} と違う`)
  }
  if (storeVersion && repo && !repo.error) {
    if (!tagVersion) {
      warn(`ストアで ${storeVersion} を公開中だがタグがない`)
    } else if (compareVersions(tagVersion, storeVersion) < 0) {
      warn(`最新タグ ${repo.tag} がストアの版 ${storeVersion} より古い（タグ付け漏れ？）`)
    } else if (compareVersions(tagVersion, storeVersion) > 0) {
      info(`タグ ${repo.tag} はまだストアに反映されていない（審査中？）`)
    }
  }

  if (repo && !repo.error) {
    // release/* 側で版を上げている場合は据え置きではない
    const bumpedInRelease = repo.releaseBranches.some((b) => {
      const v = toVersion(b)
      return v && tagVersion && compareVersions(v, tagVersion) > 0
    })
    if (repo.commitsSinceTag > 0 && tagVersion && repo.developVersion === tagVersion && !bumpedInRelease) {
      info(`develop に未リリースのコミットが ${repo.commitsSinceTag} 件あるが version は ${tagVersion} のまま`)
    }
    if (repo.dirty > 0) info(`未コミットの変更が ${repo.dirty} 件`)
  }

  return warnings
}

/** semver風の "x.y.z" を比較する。a<b なら負。App Storeの "1.1" は "1.1.0" と同じ扱い */
export function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const dash = '<span class="muted">—</span>'

function cell(main, sub) {
  if (!main) return dash
  const subHtml = sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ''
  return `<div class="main">${escapeHtml(main)}</div>${subHtml}`
}

function renderRow(row) {
  const { site, store, repo } = row
  const warnings = buildWarnings(row)

  const storeCell =
    store && !store.error
      ? `<div class="main"><a href="${escapeHtml(store.url)}">${escapeHtml(store.version)}</a></div>` +
        (store.releaseDate ? `<div class="sub">${escapeHtml(store.releaseDate)}</div>` : '')
      : dash
  const reviewCell = repo?.releaseBranches?.length
    ? repo.releaseBranches.map((b) => `<div class="main">${escapeHtml(b)}</div>`).join('')
    : dash
  const developCell = repo?.developVersion
    ? cell(
        repo.developVersion,
        [repo.commitsSinceTag > 0 ? `+${repo.commitsSinceTag} commits` : null, repo.lastCommitDate]
          .filter(Boolean)
          .join(' · '),
      )
    : dash
  const notes = warnings.length
    ? `<ul class="notes">${warnings
        .map((w) => `<li class="note note--${w.level}">${escapeHtml(w.message)}</li>`)
        .join('')}</ul>`
    : '<span class="ok">OK</span>'

  return `<tr class="${warnings.some((w) => w.level === 'warn') ? 'has-warn' : ''}">
  <th scope="row"><div class="main">${escapeHtml(site.name)}</div><div class="sub">${escapeHtml(row.id)}</div></th>
  <td>${cell(site.version ?? '—', statusLabels[site.status])}</td>
  <td>${storeCell}</td>
  <td>${cell(repo?.tag, repo?.tagDate)}</td>
  <td>${reviewCell}</td>
  <td>${developCell}</td>
  <td>${notes}</td>
</tr>`
}

export function renderHtml(rows, generatedAt) {
  const warnCount = rows.flatMap(buildWarnings).filter((w) => w.level === 'warn').length
  const summary = warnCount
    ? `<p class="summary summary--warn">要確認 ${warnCount} 件</p>`
    : '<p class="summary">食い違いはありません</p>'

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Release Status</title>
<style>
  :root {
    --bg: #faf7f2; --surface: #ffffff; --text: #2b2724; --muted: #8a827a;
    --border: #e7e0d6; --warn: #b54708; --warn-bg: #fff4e5; --info: #475467; --ok: #067647;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1c1a18; --surface: #262320; --text: #eee8e1; --muted: #9c948b;
      --border: #3a3531; --warn: #fdb022; --warn-bg: #3a2a12; --info: #b0b8c4; --ok: #47cd89;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 16px; background: var(--bg); color: var(--text);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
  main { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: var(--muted); margin: 0 0 16px; }
  .summary { font-weight: 600; margin: 0 0 16px; color: var(--ok); }
  .summary--warn { color: var(--warn); }
  .table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  table { border-collapse: collapse; width: 100%; min-width: 900px; }
  th, td { text-align: left; vertical-align: top; padding: 12px 14px; border-bottom: 1px solid var(--border); }
  thead th { font-size: 12px; color: var(--muted); font-weight: 600; white-space: nowrap; }
  tbody tr:last-child > * { border-bottom: none; }
  tr.has-warn > th { box-shadow: inset 3px 0 0 var(--warn); }
  .main { font-weight: 600; font-variant-numeric: tabular-nums; }
  .sub, .muted { color: var(--muted); font-size: 12px; }
  a { color: inherit; }
  .notes { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
  .note { padding: 2px 8px; border-radius: 6px; font-size: 12px; }
  .note--warn { color: var(--warn); background: var(--warn-bg); }
  .note--info { color: var(--info); }
  .ok { color: var(--ok); font-weight: 600; }
  footer { color: var(--muted); font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>
<main>
  <h1>Release Status</h1>
  <p class="meta">生成: ${escapeHtml(generatedAt)}</p>
  ${summary}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">アプリ</th>
          <th scope="col">サイト掲載</th>
          <th scope="col">App Store</th>
          <th scope="col">最新タグ</th>
          <th scope="col">審査中ブランチ</th>
          <th scope="col">develop</th>
          <th scope="col">注意</th>
        </tr>
      </thead>
      <tbody>
${rows.map(renderRow).join('\n')}
      </tbody>
    </table>
  </div>
  <footer>git はローカルの ref を参照しています（fetch はしていません）。App Store は iTunes Lookup API（jp）から取得。</footer>
</main>
</body>
</html>
`
}
