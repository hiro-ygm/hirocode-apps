import type { AppInfo, AppStatus, Platform } from '../data/apps'
import { ExternalLink } from './ExternalLink'

const statusLabels: Record<AppStatus, string> = {
  published: '公開中',
  review: '審査中',
  development: '開発中',
}

const platformLabels: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
}

type Props = {
  app: AppInfo
}

export function AppCard({ app }: Props) {
  const links = [
    { href: app.appStoreUrl, label: 'App Store' },
    { href: app.googlePlayUrl, label: 'Google Play' },
    { href: app.privacyPolicyUrl, label: 'Privacy Policy' },
    { href: app.supportUrl, label: 'Support' },
  ].filter((link): link is { href: string; label: string } => Boolean(link.href))

  return (
    <article className="app-card" aria-labelledby={`app-${app.id}`}>
      <img
        className="app-card__icon"
        src={app.icon}
        alt={`${app.name}のアイコン`}
        width={64}
        height={64}
        loading="lazy"
      />
      <div className="app-card__title">
        <h3 id={`app-${app.id}`}>{app.name}</h3>
        <p className="app-card__id">{app.id}</p>
      </div>

      {app.tagline && <p className="app-card__tagline">{app.tagline}</p>}
      <p className="app-card__desc">{app.description}</p>

      <ul className="app-card__platforms" aria-label="対応プラットフォーム">
        {app.platforms.map((p) => (
          <li key={p} className="chip">
            {platformLabels[p]}
          </li>
        ))}
      </ul>

      <div className="app-card__foot">
        <p className="app-card__status">
          {app.version && <span className="app-card__version">v{app.version}</span>}
          <span className={`status status--${app.status}`}>{statusLabels[app.status]}</span>
        </p>
        {links.length > 0 && (
          <ul className="app-card__links">
            {links.map((link) => (
              <li key={link.label}>
                <ExternalLink href={link.href}>{link.label}</ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
