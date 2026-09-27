import { site } from '../data/site'

type Props = {
  /** トップページへの相対パス（"./" または "../"） */
  root: string
}

export function Header({ root }: Props) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href={root} className="site-logo">
          {site.name}
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
