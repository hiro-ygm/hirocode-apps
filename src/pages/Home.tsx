import { AppsSection } from '../components/AppsSection'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'

export function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        本文へスキップ
      </a>
      <Header root="./" />
      <main id="main">
        <Hero />
        <AppsSection />
      </main>
      <Footer root="./" />
    </>
  )
}
