# hirocode Apps

hirocodeが個人開発しているアプリを紹介する静的サイト（React + TypeScript + Vite / GitHub Pages）。

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm run typecheck
npm run lint
npm run build      # dist/ に出力
npm run preview    # ビルド結果の確認
```

## アプリを追加する

1. アイコン画像（256px程度のPNG）を `src/assets/icons/<id>.png` に置く
2. `src/data/apps.ts` でアイコンをimportし、`apps` 配列に1件追加する

`status` は `published`（公開中）/ `review`（審査中）/ `development`（開発中）。
`appStoreUrl` / `googlePlayUrl` / `privacyPolicyUrl` / `supportUrl` は未設定ならカードに表示されない。

## 構成

- `src/data/apps.ts` — アプリデータ（型定義含む）
- `src/data/site.ts` — サイト名・説明・GitHub URL
- `src/components/` — Header / Hero / AppsSection / AppCard / About / Footer
- `src/pages/` — Home（`index.html`）/ Privacy（`privacy/index.html`）

## デプロイ

`main` へのpushで `.github/workflows/deploy.yml` がビルドしGitHub Pagesへデプロイする。
リポジトリの Settings → Pages → Source を「GitHub Actions」にしておく。
`base: './'`（相対パス）でビルドしているため、`/<repo>/` 配下でもカスタムドメインでもそのまま動く。

## favicon / apple-touch-icon / OGP画像

`public/` の `favicon.png`（64px）/ `apple-touch-icon.png`（180px）/ `ogp.png`（1200×630）。
元画像は `design/brand-assets-source.png`（ビルド対象外）。

OGPの `og:image` / `og:url` は絶対URLが必要なため、HTML内の `%VITE_SITE_URL%` をビルド時に置換している。
GitHub Actionsでは `configure-pages` の `base_url` が自動で入る。ローカルで確認する場合は
`VITE_SITE_URL=https://... npm run build` のように指定する。
