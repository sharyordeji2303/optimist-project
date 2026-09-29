import { Link } from 'react-router-dom';
import { ArrowUpRight, SignOut } from '@phosphor-icons/react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Reveal from '../components/Reveal.jsx';
import { useUserStore } from '../store/userStore.js';
import { projects, studio } from '../data/site.js';

/** Formats an ISO date as "12 September 2026" without pulling in a library. */
function formatDate(iso) {
  if (!iso) return 'unknown';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The protected page. Only reachable through ProtectedRoute, which means it can
 * assume a signed-in user and needs no null checks of its own.
 */
export default function Home() {
  const { user, logOut } = useUserStore();
  const recent = projects.slice(0, 4);

  return (
    <>
      <Navbar />

      <main className="shell pt-32 pb-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b pb-8" style={{ borderColor: 'rgb(var(--hairline) / 0.14)' }}>
          <div>
            <p className="label">Client area</p>
            <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.75rem)] font-medium tracking-[-0.02em]">
              {`Signed in as ${user.name}`}
            </h1>
            <p className="mt-2 text-sm text-muted">{user.email}</p>
          </div>

          {/* Logging out sends the user to the homepage; ProtectedRoute decides
              that destination from the signedOutAt flag in the user store. */}
          <button type="button" onClick={logOut} className="btn btn-ghost">
            Sign out
            <span className="btn-disc">
              <SignOut size={15} weight="light" />
            </span>
          </button>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          {/* Account details, straight from the API response. */}
          <Reveal className="lg:col-span-5">
            <h2 className="text-lg tracking-tight">Account</h2>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div>
                <dt className="label">Name</dt>
                <dd className="mt-1.5">{user.name}</dd>
              </div>
              <div>
                <dt className="label">Role</dt>
                <dd className="mt-1.5 capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="label">Email</dt>
                <dd className="mt-1.5 break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="label">Member since</dt>
                <dd className="mt-1.5">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-8 rounded-xl border p-5" style={{ borderColor: 'rgb(var(--hairline) / 0.16)', background: 'rgb(var(--surface))' }}>
              <p className="text-sm font-medium">Need something added?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {`Email the studio and it will be attached to your account record.`}
              </p>
              <a href={`mailto:${studio.email}`} className="link-rule mt-3 inline-block text-sm text-ink">
                {studio.email}
              </a>
            </div>
          </Reveal>

          {/* Recently viewed projects. */}
          <Reveal delay={100} className="lg:col-span-7">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg tracking-tight">Recent projects</h2>
              <Link to="/" className="link-rule text-sm text-muted hover:text-ink">
                Back to site
              </Link>
            </div>

            <ul className="mt-5">
              {recent.map((project) => (
                <li
                  key={project.slug}
                  className="flex items-center justify-between gap-6 border-b py-4"
                  style={{ borderColor: 'rgb(var(--hairline) / 0.12)' }}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={project.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                      loading="lazy"
                      width="48"
                      height="48"
                    />
                    <div>
                      <p className="text-sm">{project.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {project.program}
                        {' / '}
                        {project.year}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight size={15} weight="light" className="text-muted" />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Footer />
      </main>
    </>
  );
}
