import { site } from '../data/site'

export function About() {
  return (
    <section id="about" className="section section--about" aria-labelledby="about-title">
      <div className="container about">
        <h2 id="about-title">About</h2>
        <div className="about__body">
          <p className="about__name">{site.author}</p>
          <p>個人開発で、日常のちょっとした不便を解決する小さなアプリを作っています。</p>
          <p>
            営業・IT・開発の経験を活かしながら、自分自身が「こういうものがあったら便利」と思ったものを形にしています。
          </p>
        </div>
      </div>
    </section>
  )
}
