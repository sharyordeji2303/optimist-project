import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Reveal from '../components/Reveal.jsx';
import { capabilities, images, statement, studio } from '../data/site.js';

export default function About() {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-32 pb-16">
        <section className="shell">
          <p className="label">About {studio.full}</p>
          <h1 className="mt-5 max-w-[20ch] text-display-sm font-medium">
            Thoughtful buildings. Lasting relationships.
          </h1>
          <p className="lede-measure mt-7 text-lede text-muted">
            We work on civic, cultural and adaptive reuse projects across three continents.
            Every project begins with understanding the place, its people and what is already there.
          </p>
        </section>
        {/* ---------------------------------------------------------------
            Practice. A grouped typographic list, because five parallel items
            in a card row would flatten the hierarchy.
        --------------------------------------------------------------- */}
        <section id="practice" className="shell scroll-mt-24 pt-24">
          <Reveal as="h2" className="max-w-[22ch] text-display-sm font-medium">
            What the practice does
          </Reveal>

          <ul className="mt-12 grid gap-x-14 md:grid-cols-2">
            {capabilities.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={(index % 2) * 90}
                className="border-t py-7"
                style={{ borderColor: 'rgb(var(--hairline) / 0.14)' }}
              >
                <h3 className="text-xl tracking-tight">{item.title}</h3>
                <p className="body-measure mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------
            Statement. Full-bleed image band, used once, so the page changes
            pace instead of repeating the same column rhythm.
        --------------------------------------------------------------- */}
        <section className="relative mt-24 min-h-[26rem] overflow-hidden">
          <img
            src={images.statement}
            alt="Sweeping staircase with timber balustrades beneath a bright skylight"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            width="1800"
            height="1000"
          />
          {/* Scrim only, so the type stays legible over any photograph. */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,8,9,0.82) 0%, rgba(8,8,9,0.45) 60%, rgba(8,8,9,0.25) 100%)' }} />

          <div className="shell relative flex min-h-[26rem] flex-col justify-end py-16">
            <Reveal as="blockquote" className="max-w-[38ch]">
              <p className="display-balanced text-[clamp(1.35rem,2.6vw,2.2rem)] font-medium leading-[1.2] tracking-[-0.02em] text-white">
                {statement.line}
              </p>
              <footer className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-white/70">
                {statement.attribution}
              </footer>
            </Reveal>
          </div>
        </section>


        <div className="shell">
          <Footer />
        </div>
      </main>
    </>
  );
}