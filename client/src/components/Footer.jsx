import { Link } from 'react-router-dom';
import { nav, studio } from '../data/site.js';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="studio" className="mt-24 border-t pt-14" style={{ borderColor: 'rgb(var(--hairline) / 0.14)' }}>
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-2xl tracking-tight">{studio.full}</p>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-muted">
            {studio.discipline}. Currently taking on work for next year.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="label">Navigate</p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="link-rule text-ink/80 hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/signup" className="link-rule text-ink/80 hover:text-ink">
                Create account
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="label">Contact</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`mailto:${studio.email}`} className="link-rule text-ink/80 hover:text-ink">
                {studio.email}
              </a>
            </li>
            <li className="text-muted">{studio.phone}</li>
            <li className="text-muted">{studio.address}</li>
          </ul>
        </div>
      </div>

      <div
        className="mt-14 flex flex-col gap-2 border-t pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: 'rgb(var(--hairline) / 0.14)' }}
      >
        <p>
          {`Copyright ${year} ${studio.full}. All rights reserved.`}
        </p>
        <p>{studio.discipline}</p>
      </div>
    </footer>
  );
}
