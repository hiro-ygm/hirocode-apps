import { site } from '../data/site'
import { ExternalLink } from './ExternalLink'

type Props = {
  root: string
}

/** About とサイト内リンクをまとめたフッター（全ページ共通） */
export function Footer({ root }: Props) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <section id="about" className="about" aria-labelledby="about-title">
          <h2 id="about-title">About</h2>
          <p className="about__name">{site.author}</p>
          <div className="about__body">
            <p>個人開発で、日常のちょっとした不便を解決する小さなアプリを作っています。</p>
            <p>
              営業・IT・開発の経験を活かしながら、自分自身が「こういうものがあったら便利」と思ったものを形にしています。
            </p>
          </div>
        </section>

        <div className="site-footer__side">
          <ul className="footer-links">
            <li>
              <a href={`${root}#apps`}>Apps</a>
            </li>
            <li>
              <a href={`${root}privacy/`}>Privacy Policy</a>
            </li>
            <li>
              <ExternalLink href={site.githubUrl}>GitHub</ExternalLink>
            </li>
          </ul>
          <p className="site-footer__copy">© {site.author}</p>
        </div>
      </div>
    </footer>
  )
}
