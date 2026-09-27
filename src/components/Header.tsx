import { site } from '../data/site'

// "hirocode Apps" → 先頭の語を太字、残りを細字で表示する
const [logoMain, ...logoSub] = site.name.split(' ')

type Props = {
  /** トップページへの相対パス（"./" または "../"） */
  root: string
}

export function Header({ root }: Props) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href={root} className="site-logo">
          <span className="site-logo__main">{logoMain}</span> <span className="site-logo__sub">{logoSub.join(' ')}</span>
        </a>
        <nav aria-label="メインナビゲーション">
          <ul className="site-nav">
            <li>
              <a href={`${root}#apps`}>Apps</a>
            </li>
            <li>
              <a href={`${root}#about`}>About</a>
            </li>
            {/* 開発サーバーでだけ表示（本番ビルドでは除去される）。レポートは scripts/dev-release-status.mjs が生成 */}
            {import.meta.env.DEV && (
              <li>
                <a href={`${root}release-status/`} className="site-nav__dev">
                  Release Status
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
