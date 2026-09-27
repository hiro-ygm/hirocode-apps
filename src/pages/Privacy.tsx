import { ExternalLink } from '../components/ExternalLink'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { site } from '../data/site'

const root = '../'

export function Privacy() {
  return (
    <>
      <a href="#main" className="skip-link">
        本文へスキップ
      </a>
      <Header root={root} />
      <main id="main" className="section">
        <article className="container prose">
          <h1>プライバシーポリシー</h1>
          <p>
            本ポリシーは、{site.author}が運営するWebサイト「{site.name}
            」（以下「本サイト」）における情報の取り扱いについて定めるものです。
          </p>
          <p className="prose__note">
            本サイトで紹介している各アプリのプライバシーポリシーは、アプリごとに別途定めています。各アプリについては
            <a href={`${root}#apps`}>アプリ一覧</a>
            のカードに掲載している各アプリのPrivacy Policyをご確認ください。
          </p>

          <h2>本サイトで収集する情報</h2>
          <p>
            本サイトは、アプリを紹介するための静的なWebサイトです。ユーザー登録、ログイン、お問い合わせフォームなど、個人情報を入力する機能はありません。
          </p>
          <p>
            また、アクセス解析ツール、広告配信、Cookieを利用したトラッキングは使用していません。
          </p>

          <h2>ホスティングサービスについて</h2>
          <p>
            本サイトはGitHub Pagesで公開しています。本サイトの閲覧時には、GitHubがサービス運営のためにIPアドレスなどのアクセス情報を記録する場合があります。詳しくは
            <ExternalLink href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">
              GitHubのプライバシーステートメント
            </ExternalLink>
            をご確認ください。
          </p>

          <h2>外部サイトへのリンク</h2>
          <p>
            本サイトには、App Storeなどの外部サイトへのリンクが含まれます。リンク先での情報の取り扱いについては、各サイトのプライバシーポリシーをご確認ください。
          </p>

          <h2>本ポリシーの変更</h2>
          <p>本ポリシーの内容は、必要に応じて変更することがあります。変更後の内容は本ページに掲載します。</p>

          <p className="prose__date">制定日：2026年9月27日</p>
        </article>
      </main>
      <Footer root={root} />
    </>
  )
}
