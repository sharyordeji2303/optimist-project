import { ArrowUpRight } from '@phosphor-icons/react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ProjectGrid from '../components/ProjectGrid.jsx';
import Reveal from '../components/Reveal.jsx';
import { disciplines, images, studio } from '../data/site.js';

/**
 * The landing page.
 *
 * Section order and the layout family each one uses, so no two sections repeat a
 * composition: hero split, marquee band, masonry grid,
 * and contact section.
 */
export default function Landing() {
  return (
    <>
      <Navbar />

      <main id="main">
        {/* ---------------------------------------------------------------
            Hero. Deliberately three text elements only: headline, one sentence
            of support, and two actions. It is sized to stay inside the first
            viewport, so the call to action is never below the fold.
        --------------------------------------------------------------- */}
        <section className="shell flex min-h-[100dvh] flex-col justify-center pt-24 pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h1 className="display-balanced text-[clamp(2.5rem,6vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.03em]">
                Buildings that earn their place.
              </h1>

              <p className="lede-measure mt-7 text-lede text-muted">
                Halden is an architecture and interiors practice working on civic, cultural
                and adaptive reuse projects across three continents.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#contact" className="btn btn-solid">
                  Start a project
                  <span className="btn-disc">
                    <ArrowUpRight size={15} weight="light" />
                  </span>
                </a>
                <a href="#work" className="btn btn-ghost">
                  Selected work
                  <span className="btn-disc">
                    <ArrowUpRight size={15} weight="light" />
                  </span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="clip-reveal is-visible overflow-hidden rounded-xl">
                <img
                  src={images.hero}
                  alt="Sunlit courtyard framed by brick walls and sculptural window bays"
                  className="h-[clamp(18rem,52vh,34rem)] w-full object-cover"
                  width="1000"
                  height="1250"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Disciplines band. The only marquee on the page.
        --------------------------------------------------------------- */}
        <section aria-label="Disciplines" className="marquee border-y py-5" style={{ borderColor: 'rgb(var(--hairline) / 0.14)' }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee-track" aria-hidden={copy === 1 ? 'true' : undefined}>
              {disciplines.map((item) => (
                <span key={`${copy}-${item}`} className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </section>

        {/* ---------------------------------------------------------------
            Work. Masonry grid.
        --------------------------------------------------------------- */}
        <section id="work" className="shell scroll-mt-24 pt-24">
          <Reveal as="h2" className="max-w-[24ch] text-display-sm font-medium">
            Selected work
          </Reveal>
          <Reveal as="p" delay={80} className="body-measure mt-4 text-muted">
            Six projects completed between 2022 and 2025. Each one began with measuring what was
            already on the site.
          </Reveal>

          <div className="mt-14">
            <ProjectGrid />
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Closing block.
        --------------------------------------------------------------- */}
        <section id="contact" className="shell scroll-mt-24 pt-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-7">
              <h2 className="display-balanced text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.03em]">
                Tell us what you are building.
              </h2>
              <p className="lede-measure mt-6 text-muted">
                Send the site, the budget range and the deadline. If it is a fit, we will come back
                with a fee proposal and a programme.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href={`mailto:${studio.email}`} className="btn btn-solid">
                  Start a project
                  <span className="btn-disc">
                    <ArrowUpRight size={15} weight="light" />
                  </span>
                </a>
              </div>
            </Reveal>

            {/* A real component, not a fake screenshot: the account panel that
                actually exists behind the sign-in route. */}
            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-xl border p-6" style={{ borderColor: 'rgb(var(--hairline) / 0.16)', background: 'rgb(var(--surface))' }}>
                <p className="label">Client area</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Project files, drawing issues and meeting notes for current clients sit behind a
                  signed-in account.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="/signup" className="btn btn-ghost">
                    Create account
                    <span className="btn-disc">
                      <ArrowUpRight size={15} weight="light" />
                    </span>
                  </a>
                  <a href="/login" className="link-rule self-center text-sm text-ink/80 hover:text-ink">
                    Sign in
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Footer />
        </section>
      </main>
    </>
  );
}
