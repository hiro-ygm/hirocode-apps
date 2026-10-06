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

## アプリの公開ページ（プライバシーポリシー・サポート）

`public/<app id>/privacy/index.html` と `public/<app id>/support/index.html` に置く（ビルド時に `public/` がそのまま配信される）。
URL は `https://hiro-ygm.github.io/hirocode-apps/<app id>/privacy/` など。
中身は各アプリのリポジトリで生成する（例: hangultsunagi は `python3 design/scripts/build_web_pages.py --site ../hirocode-apps`）。ここで直接編集しない。

## アプリを公開・更新したとき

1. `src/data/apps.ts` の該当アプリで `status: 'published'`・`version`・`appStoreUrl`（初回公開時）を更新する
2. `fix/<app id>-<version>` ブランチで commit → `main` へ merge・push（GitHub Pages へ自動デプロイ）
3. `npm run status` で Release Status を再生成し、警告が出ていないことを確認する

各アプリの `docs/07-release.md` §1a（承認後の手順 5）からもここを参照する。

## リリース状況レポート（開発者用）

```bash
npm run status     # release-status/index.html を生成してブラウザで開く
```

`apps.ts` の各アプリについて、サイト掲載の版・App Storeの公開版（iTunes Lookup API）・
最新タグ・`release/*` ブランチ・`develop` の `app.json` version を一覧し、食い違いを警告する。
審査状況は App Store Connect API（GETのみ）から取得する。APIキーは各アプリの `eas.json`（`submit.production.ios` の
`ascApiKeyId` / `ascApiKeyIssuerId` / `ascApiKeyPath`）の設定をそのまま使うため、このリポジトリに秘密情報は置かない。
各アプリのリポジトリが `../<app id>` にある前提。生成物はgitignore済みでデプロイされない。
gitはローカルのrefを見るだけなので、最新にしたい場合は各リポジトリで `git fetch` しておく。

`npm run dev` 中はヘッダーに「Release Status」リンクが出て、`/release-status/` を開くたびにレポートを再生成して表示する
（`scripts/dev-release-status.mjs`）。本番ビルドにはリンクもレポートも含まれない。

## 構成

- `src/data/apps.ts` — アプリデータ（型定義含む）
- `src/data/site.ts` — サイト名・説明・GitHub URL
- `src/components/` — Header / Hero（+ Landscape: 風景イラストSVG）/ AppsSection / AppCard / Footer（About を含む）
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
`VITE_SITE_URL=https://... npm run build` のように指定する（または `.env.example` を `.env` にコピーして設定する）。
未設定のままビルドすると `og:image` が相対パスになるため、ビルド時に警告を出す。
