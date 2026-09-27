import { apps } from '../data/apps'
import { AppCard } from './AppCard'

export function AppsSection() {
  return (
    <section id="apps" className="section" aria-labelledby="apps-title">
      <div className="container">
        <div className="section__head">
          <h2 id="apps-title">Apps</h2>
          <p className="section__count">{apps.length} apps</p>
        </div>
        <ul className="app-grid">
          {apps.map((app) => (
            <li key={app.id}>
              <AppCard app={app} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
