// リリース状況レポートの判定とHTML生成（副作用なし）。
// データ収集は release-status.mjs が行う。

const statusLabels = {
  published: '公開中',
  review: '審査中',
  development: '開発中',
}

// App Store Connect の appVersionState（旧 appStoreState）の表示名
const ascStateLabels = {
  PREPARE_FOR_SUBMISSION: '提出準備中',
  WAITING_FOR_EXPORT_COMPLIANCE: '輸出コンプライアンス待ち',
  WAITING_FOR_REVIEW: '審査待ち',
  IN_REVIEW: '審査中',
  PENDING_DEVELOPER_RELEASE: '承認済み・手動リリース待ち',
  PENDING_APPLE_RELEASE: '承認済み・リリース待ち',
  PROCESSING_FOR_DISTRIBUTION: '配信準備中',
  ACCEPTED: '承認済み',
  REJECTED: 'リジェクト',
  METADATA_REJECTED: 'メタデータのリジェクト',
  INVALID_BINARY: 'バイナリ不備',
  DEVELOPER_REJECTED: '取り下げ',
}

const reviewStates = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW'])
const rejectedStates = new Set(['REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'])
// 公開済み・置き換え済みなど「進行中ではない」状態
const settledStates = new Set([
  'READY_FOR_DISTRIBUTION',
  'READY_FOR_SALE',
  'REPLACED_WITH_NEW_VERSION',
  'REMOVED_FROM_SALE',
  'DEVELOPER_REMOVED_FROM_SALE',
])

export function ascStateLabel(state) {
  return ascStateLabels[state] ?? state
}

/** 進行中（公開前）の最新バージョンを選ぶ。なければ null */
export function pickPendingVersion(versions) {
  return (
    [...versions]
      .filter((v) => !settledStates.has(v.state))
      .sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)))[0] ?? null
  )
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

  const { site, store, repo, asc } = row
  const tagVersion = toVersion(repo?.tag)

  if (store?.error) warn(`App Storeの取得に失敗: ${store.error}`)
  if (asc?.error) warn(`App Store Connectの取得に失敗: ${asc.error}`)
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

  if (asc && !asc.error) {
    const pending = asc.pending
    const inReview = pending && reviewStates.has(pending.state)
    if (site.status === 'review' && !inReview) {
      warn('サイトは「審査中」だがApp Store Connectに審査中の版がない')
    }
    if (inReview && site.status === 'development') {
      warn(`${pending.version} が${ascStateLabel(pending.state)}だがサイトは「開発中」のまま`)
    }
    if (pending && rejectedStates.has(pending.state)) {
      warn(`${pending.version} が${ascStateLabel(pending.state)}になっている`)
    }
    if (pending?.state === 'PENDING_DEVELOPER_RELEASE') {
      info(`${pending.version} は承認済み。App Store Connectで手動リリースが必要`)
    }
  } else if (asc === null && repo && !repo.error) {
    info('App Store Connectの設定なし（eas.json の submit.production.ios）')
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

/** カード右上のバッジ。tone は色の種類 */
function overallBadge(row, warnings) {
  if (warnings.some((w) => w.level === 'warn')) return { tone: 'warn', label: '要確認' }
  const pending = row.asc?.pending
  if (pending && rejectedStates.has(pending.state)) return { tone: 'warn', label: ascStateLabel(pending.state) }
  if (pending && reviewStates.has(pending.state)) return { tone: 'review', label: ascStateLabel(pending.state) }
  if (row.store && !row.store.error) return { tone: 'live', label: '公開中' }
  return { tone: 'idle', label: statusLabels[row.site.status] }
}

function laneTone(state) {
  if (rejectedStates.has(state)) return 'warn'
  if (reviewStates.has(state)) return 'review'
  if (state === 'PENDING_DEVELOPER_RELEASE' || state === 'PENDING_APPLE_RELEASE' || state === 'ACCEPTED') return 'live'
  return 'active'
}

/**
 * 公開・審査・開発を独立した行として返す（1つの版が流れるわけではないので矢印でつながない）。
 * 開発の版は、公開中・審査中より新しいときだけ表示する（develop の app.json が据え置きのことがあるため）
 */
function buildLanes(row) {
  const { repo, asc, store } = row
  const pending = asc && !asc.error ? asc.pending : null
  const liveVersion = store && !store.error ? store.version : null
  const release = repo?.releaseBranches?.length ? repo.releaseBranches.join(', ') : null

  const live = liveVersion
    ? {
        tone: 'live',
        value: liveVersion,
        detail: [store.releaseDate, repo?.tag].filter(Boolean).join(' · '),
        href: store.url,
      }
    : { tone: 'empty', value: '—', detail: '未公開' }

  const review = pending
    ? {
        tone: laneTone(pending.state),
        value: pending.version,
        chip: ascStateLabel(pending.state),
        detail: release ?? 'release ブランチなし',
      }
    : { tone: 'empty', value: '—', detail: release ? `進行中の版なし（${release}）` : '進行中の版なし' }

  let dev = { tone: 'empty', value: '—', detail: repo ? 'app.json なし' : 'リポジトリなし' }
  if (repo?.developVersion) {
    const shipped = [liveVersion, pending?.version].filter(Boolean)
    const isNewer = shipped.every((v) => compareVersions(repo.developVersion, v) > 0)
    const since = repo.tag ? `${repo.tag} 以降 ` : ''
    dev = {
      tone: isNewer || repo.commitsSinceTag > 0 ? 'active' : 'empty',
      value: isNewer ? repo.developVersion : '—',
      detail: repo.commitsSinceTag > 0 ? `${since}+${repo.commitsSinceTag} commits` : '未リリースの変更なし',
    }
  }

  return [
    { label: '公開', ...live },
    { label: '審査', ...review },
    { label: '開発', ...dev },
  ]
}

function renderLane(lane) {
  const value = lane.href
    ? `<a href="${escapeHtml(lane.href)}">${escapeHtml(lane.value)}</a>`
    : escapeHtml(lane.value)
  const chip = lane.chip ? `<span class="chip chip--${lane.tone}">${escapeHtml(lane.chip)}</span>` : ''
  return `<li class="lane lane--${lane.tone}">
        <span class="lane__label">${escapeHtml(lane.label)}</span>
        <span class="lane__value${lane.value === '—' ? ' lane__value--none' : ''}">${value}</span>
        <span class="lane__detail">${chip}<span>${escapeHtml(lane.detail)}</span></span>
      </li>`
}

function renderCard(row) {
  const { site, store } = row
  const warnings = buildWarnings(row)
  const badge = overallBadge(row, warnings)
  const storeVersion = store && !store.error ? store.version : null
  const siteMatches = !storeVersion || !site.version || compareVersions(site.version, storeVersion) === 0
  const icon = row.icon
    ? `<img class="card__icon" src="${escapeHtml(row.icon)}" alt="" width="48" height="48">`
    : `<span class="card__icon card__icon--blank" aria-hidden="true"></span>`
  const notes = warnings.length
    ? `<ul class="notes">${warnings
        .map(
          (w) =>
            `<li class="note note--${w.level}"><span class="note__mark" aria-hidden="true">${
              w.level === 'warn' ? '!' : 'i'
            }</span>${escapeHtml(w.message)}</li>`,
        )
        .join('')}</ul>`
    : ''

  return `<article class="card card--${badge.tone}">
    <header class="card__head">
      ${icon}
      <div class="card__title">
        <h2>${escapeHtml(site.name)}</h2>
        <p class="card__site ${siteMatches ? '' : 'card__site--ng'}">サイト掲載：${escapeHtml(
          statusLabels[site.status],
        )} · ${escapeHtml(site.version ?? '—')}</p>
      </div>
      <span class="badge badge--${badge.tone}">${escapeHtml(badge.label)}</span>
    </header>
    <ul class="lanes">
      ${buildLanes(row).map(renderLane).join('\n      ')}
    </ul>
    ${notes}
  </article>`
}

function summarize(rows) {
  const warn = rows.flatMap(buildWarnings).filter((w) => w.level === 'warn').length
  const live = rows.filter((r) => r.store && !r.store.error).length
  const review = rows.filter((r) => r.asc?.pending && reviewStates.has(r.asc.pending.state)).length
  return { warn, live, review }
}

export function renderHtml(rows, generatedAt) {
  const { warn, live, review } = summarize(rows)
  const tile = (tone, label, value) =>
    `<div class="tile tile--${tone}"><span class="tile__value">${value}</span><span class="tile__label">${label}</span></div>`

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Release Status</title>
<style>
  :root {
    --bg: #faf7f2; --surface: #ffffff; --ink: #1f1d1a; --muted: #6f685f; --line: #ebe4da;
    --empty: #c9c1b6;
    --live: #0f7b4a; --live-soft: #e3f4ea;
    --review: #2759c4; --review-soft: #e6edfb;
    --active: #b4532a; --active-soft: #f6e6dc;
    --warn: #c2410c; --warn-soft: #fff1e6;
    --idle: #6f685f; --idle-soft: #efeae3;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1816; --surface: #24211e; --ink: #f2ede6; --muted: #a9a196; --line: #36322d;
      --empty: #4d4740;
      --live: #4cc98a; --live-soft: #173326;
      --review: #7fa5f5; --review-soft: #1c2740;
      --active: #ec9468; --active-soft: #3a261b;
      --warn: #fb9a5b; --warn-soft: #3d2415;
      --idle: #a9a196; --idle-soft: #2e2a26;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 16px 56px; background: var(--bg); color: var(--ink);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
  main { max-width: 1080px; margin: 0 auto; }
  .top { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0; letter-spacing: -0.01em; }
  .meta { color: var(--muted); margin: 4px 0 0; font-size: 13px; }
  .tiles { display: flex; gap: 10px; }
  .tile { min-width: 92px; padding: 10px 14px; border-radius: 12px; background: var(--surface);
    border: 1px solid var(--line); display: grid; }
  .tile__value { font-size: 24px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .tile__label { color: var(--muted); font-size: 12px; }
  .tile--live .tile__value { color: var(--live); }
  .tile--review .tile__value { color: var(--review); }
  .tile--warn .tile__value { color: var(--warn); }
  .tile--ok .tile__value { color: var(--muted); }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr)); gap: 16px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 18px; align-content: start; min-width: 0;
    display: grid; gap: 16px; }
  .card--warn { border-color: var(--warn); box-shadow: 0 0 0 1px var(--warn); }
  .card__head { display: flex; align-items: center; gap: 12px; }
  .card__icon { width: 48px; height: 48px; border-radius: 11px; flex: none; border: 1px solid var(--line); }
  .card__icon--blank { display: block; background: var(--idle-soft); }
  .card__title { flex: 1; min-width: 0; }
  h2 { font-size: 17px; margin: 0; }
  .card__site { margin: 2px 0 0; color: var(--muted); font-size: 12px; }
  .card__site--ng { color: var(--warn); font-weight: 600; }
  .badge { flex: none; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .badge--live { color: var(--live); background: var(--live-soft); }
  .badge--review { color: var(--review); background: var(--review-soft); }
  .badge--warn { color: var(--warn); background: var(--warn-soft); }
  .badge--idle { color: var(--idle); background: var(--idle-soft); }

  .lanes { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .lane { display: grid; grid-template-columns: 2.5em 4.5em minmax(0, 1fr); align-items: center; column-gap: 12px;
    padding: 8px 12px; border-radius: 10px; background: var(--bg); border-left: 4px solid var(--empty); }
  .lane__label { font-size: 12px; font-weight: 700; color: var(--muted); }
  .lane__value { font-size: 18px; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; }
  .lane__value a { color: inherit; text-decoration: none; }
  .lane__value a:hover { text-decoration: underline; }
  .lane__detail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 12px;
    color: var(--muted); min-width: 0; overflow-wrap: anywhere; }
  .lane__value--none { color: var(--empty); }
  .lane--active { border-left-color: var(--active); }
  .lane--live { border-left-color: var(--live); }
  .lane--review { border-left-color: var(--review); background: var(--review-soft); }
  .lane--warn { border-left-color: var(--warn); background: var(--warn-soft); }
  .chip { justify-self: start; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .chip--review { color: var(--surface); background: var(--review); }
  .chip--warn { color: var(--surface); background: var(--warn); }
  .chip--live { color: var(--live); background: var(--live-soft); }
  .chip--active { color: var(--active); background: var(--active-soft); }

  .notes { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .note { display: flex; gap: 8px; align-items: baseline; font-size: 12px; color: var(--muted); }
  .note--warn { color: var(--warn); font-weight: 600; }
  .note__mark { flex: none; width: 16px; height: 16px; border-radius: 50%; display: inline-grid; place-items: center;
    font-size: 10px; font-weight: 700; background: var(--idle-soft); color: var(--muted); }
  .note--warn .note__mark { background: var(--warn-soft); color: var(--warn); }
  footer { color: var(--muted); font-size: 12px; margin-top: 24px; }
  @media (max-width: 520px) {
    .tiles { width: 100%; }
    .tile { flex: 1; min-width: 0; }
  }
</style>
</head>
<body>
<main>
  <div class="top">
    <div>
      <h1>Release Status</h1>
      <p class="meta">${escapeHtml(generatedAt)} 時点</p>
    </div>
    <div class="tiles">
      ${tile('live', '公開中', live)}
      ${tile('review', '審査中', review)}
      ${tile(warn ? 'warn' : 'ok', '要確認', warn)}
    </div>
  </div>
  <div class="grid">
${rows.map(renderCard).join('\n')}
  </div>
  <footer>git はローカルの ref を参照しています（fetch はしていません）。App Store は iTunes Lookup API（jp）、審査状況は App Store Connect API（読み取りのみ）から取得。</footer>
</main>
</body>
</html>
`
}
