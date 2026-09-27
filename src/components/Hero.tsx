import { site } from '../data/site'
import { Landscape } from './Landscape'

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Landscape />
      <div className="container hero__inner">
        <p className="hero__eyebrow">
          {site.tagline}
          <svg className="hero__scribble" viewBox="0 0 160 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 8c30-5 70-7 100-5 20 1 38 2 56 0" />
          </svg>
        </p>
        <h1 id="hero-title" className="hero__title">
          {site.name}
        </h1>
        <p className="hero__lead">{site.description}</p>
      </div>
    </section>
  )
}
