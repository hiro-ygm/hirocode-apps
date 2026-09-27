import { site } from '../data/site'
import { ExternalLink } from './ExternalLink'

type Props = {
  root: string
}

export function Footer({ root }: Props) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>© {site.author}</p>
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
      </div>
    </footer>
  )
}
