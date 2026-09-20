import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, SpinnerGap } from '@phosphor-icons/react';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError } from '../api/client.js';

/** Shared shell for sign-in and sign-up: brand panel plus form. */
export function AuthLayout({ title, intro, children, footer }) {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel. Hidden on small screens where it would just push the form down. */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://picsum.photos/seed/halden-auth-facade/1400/1800"
          alt="A Halden project facade photographed in flat daylight"
          className="absolute inset-0 h-full w-full object-cover"
          width="1400"
          height="1800"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,9,0.35) 0%, rgba(8,8,9,0.78) 100%)' }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="text-lg font-medium tracking-tight text-white">
            Halden
          </Link>
          <p className="max-w-[26ch] text-sm leading-relaxed text-white/80">
            Client area for drawings, issues and meeting notes.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[26rem]">
          <Link to="/" className="link-rule text-sm text-muted hover:text-ink lg:hidden">
            Halden
          </Link>
          <h1 className="mt-8 text-3xl tracking-tight lg:mt-0">{title}</h1>
          {intro && <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>}
          <div className="mt-9">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </main>
  );
}

/** The whole submit row: disabled while in flight, with a visible spinner. */
export function SubmitButton({ pending, label, pendingLabel }) {
  return (
    <button type="submit" disabled={pending} className="btn btn-solid w-full justify-between disabled:opacity-70">
      {pending ? pendingLabel : label}
      <span className="btn-disc">
        {pending ? <SpinnerGap size={15} weight="light" className="animate-spin" /> : <ArrowUpRight size={15} weight="light" />}
      </span>
    </button>
  );
}

/** Banner for an error that is not tied to a single field. */
export function FormError({ error }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border px-4 py-3 text-sm"
      style={{ borderColor: 'rgba(192,57,43,0.4)', color: '#b03024', background: 'rgba(192,57,43,0.06)' }}
    >
      {error}
    </p>
  );
}

export function useAuthForm(initial) {
  const [values, setValues] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [pending, setPending] = useState(false);

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    // Clear the message for a field as soon as the user edits it.
    setFieldErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  /** Turns an ApiError into field errors plus an optional summary line. */
  const applyError = (error) => {
    if (error instanceof ApiError && error.fields) {
      setFieldErrors(error.fields);
      setFormError(null);
      return;
    }
    setFormError(error.message || 'Something went wrong. Try again.');
  };

  return { values, fieldErrors, formError, pending, setPending, update, applyError, setFormError };
}

export function useRedirectAfterAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || '/dashboard';
  return () => navigate(destination, { replace: true });
}
