import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, List, Moon, Sun, X } from '@phosphor-icons/react';
import { nav, studio } from '../data/site.js';
import { useUserStore } from '../store/userStore.js';

const THEME_KEY = 'halden.theme';

/** Applies and remembers the light/dark choice. Defaults to the OS setting. */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable, the attribute alone still works */
    }
  }, [theme]);

  const toggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { isDark, toggle };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { user, logOut } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Any navigation closes the mobile sheet, otherwise it stays over the new page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Freeze the page behind the overlay, and restore whatever it was on close.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : previous || '';
    return () => {
      document.body.style.overflow = previous || '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSignOut = () => {
    logOut();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="shell">
        {/* A detached pill rather than a bar welded to the top edge. */}
        <div className="nav-pill mt-4 flex h-14 items-center justify-between rounded-full pl-5 pr-2">
          <Link to="/" className="text-[0.9375rem] font-medium tracking-tight" aria-label={`${studio.name} home`}>
            {studio.name}
            <span className="ml-2 hidden font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted sm:inline">
              Studio
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-rule text-sm text-ink/80 hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="grid h-9 w-9 place-items-center rounded-full text-ink/70 transition-colors duration-500 ease-editorial hover:text-ink"
            >
              {isDark ? <Sun size={17} weight="light" /> : <Moon size={17} weight="light" />}
            </button>

            {user ? (
              <Link to="/dashboard" className="btn btn-solid hidden sm:inline-flex">
                Dashboard
                <span className="btn-disc">
                  <ArrowUpRight size={15} weight="light" />
                </span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-solid hidden sm:inline-flex">
                Sign in
                <span className="btn-disc">
                  <ArrowUpRight size={15} weight="light" />
                </span>
              </Link>
            )}

            <button
              type="button"
              className="burger grid h-9 w-9 place-items-center rounded-full text-ink md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? (
                <X size={18} weight="light" />
              ) : (
                <span className="relative block">
                  <span className="burger" aria-hidden="true" style={{ display: 'block' }}>
                    <span />
                    <span />
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen sheet. Links arrive in sequence rather than all at once. */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 top-0 z-30 flex flex-col justify-between bg-paper px-6 pb-10 pt-28 md:hidden"
        >
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {nav.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="reveal is-visible border-b py-4 text-3xl tracking-tight"
                style={{
                  borderColor: 'rgb(var(--hairline) / 0.12)',
                  '--reveal-delay': `${60 + index * 70}ms`,
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn btn-solid justify-between">
                  Dashboard
                  <span className="btn-disc">
                    <ArrowUpRight size={15} weight="light" />
                  </span>
                </Link>
                <button type="button" onClick={handleSignOut} className="btn btn-ghost justify-between">
                  Sign out
                  <span className="btn-disc">
                    <List size={15} weight="light" />
                  </span>
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="btn btn-solid justify-between">
                Sign in
                <span className="btn-disc">
                  <ArrowUpRight size={15} weight="light" />
                </span>
              </Link>
            )}
            <p className="label">{studio.email}</p>
          </div>
        </div>
      )}
    </header>
  );
}
