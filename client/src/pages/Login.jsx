import { Link } from 'react-router-dom';
import { AuthLayout, FormError, SubmitButton, useAuthForm, useRedirectAfterAuth } from './AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const form = useAuthForm({ email: '', password: '' });
  const redirect = useRedirectAfterAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    form.setPending(true);
    form.setFormError(null);

    try {
      await login({ email: form.values.email, password: form.values.password });
      redirect();
    } catch (error) {
      form.applyError(error);
    } finally {
      form.setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      intro="Use the email address your account was created with."
      footer={
        <>
          No account yet?{' '}
          <Link to="/signup" className="link-rule text-ink">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError error={form.formError} />

        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@practice.com"
          value={form.values.email}
          onChange={form.update('email')}
          error={form.fieldErrors.email}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.values.password}
          onChange={form.update('password')}
          error={form.fieldErrors.password}
        />

        <SubmitButton pending={form.pending} label="Sign in" pendingLabel="Signing in" />
      </form>
    </AuthLayout>
  );
}
