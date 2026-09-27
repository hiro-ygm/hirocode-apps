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
          </ul>
        </nav>
      </div>
    </header>
  )
}
