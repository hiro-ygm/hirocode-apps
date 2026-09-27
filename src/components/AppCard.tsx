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
  const hasStoreLinks = app.appStoreUrl || app.googlePlayUrl
  const hasInfoLinks = app.privacyPolicyUrl || app.supportUrl

  return (
    <article className="app-card" aria-labelledby={`app-${app.id}`}>
      <div className="app-card__head">
        <img
          className="app-card__icon"
          src={app.icon}
          alt={`${app.name}のアイコン`}
          width={72}
          height={72}
          loading="lazy"
        />
        <div className="app-card__title">
          <h3 id={`app-${app.id}`}>{app.name}</h3>
          <p className="app-card__id">{app.id}</p>
        </div>
        <span className={`status status--${app.status}`}>{statusLabels[app.status]}</span>
      </div>

      {app.tagline && <p className="app-card__tagline">{app.tagline}</p>}
      <p className="app-card__desc">{app.description}</p>

      <dl className="app-card__meta">
        <div>
          <dt>Platform</dt>
          <dd>{app.platforms.map((p) => platformLabels[p]).join(' / ')}</dd>
        </div>
        {app.version && (
          <div>
            <dt>Version</dt>
            <dd>{app.version}</dd>
          </div>
        )}
      </dl>

      {(hasStoreLinks || hasInfoLinks) && (
        <div className="app-card__actions">
          {hasStoreLinks && (
            <div className="store-links">
              {app.appStoreUrl && (
                <ExternalLink href={app.appStoreUrl} className="button">
                  App Store
                </ExternalLink>
              )}
              {app.googlePlayUrl && (
                <ExternalLink href={app.googlePlayUrl} className="button">
                  Google Play
                </ExternalLink>
              )}
            </div>
          )}
          {hasInfoLinks && (
            <ul className="info-links">
              {app.privacyPolicyUrl && (
                <li>
                  <ExternalLink href={app.privacyPolicyUrl}>Privacy Policy</ExternalLink>
                </li>
              )}
              {app.supportUrl && (
                <li>
                  <ExternalLink href={app.supportUrl}>Support</ExternalLink>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}
