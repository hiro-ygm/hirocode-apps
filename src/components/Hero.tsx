import { site } from '../data/site'

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <p className="hero__eyebrow">{site.name}</p>
        <h1 id="hero-title" className="hero__title">
          {site.tagline}
        </h1>
        <p className="hero__lead">{site.description}</p>
      </div>
    </section>
  )
}
