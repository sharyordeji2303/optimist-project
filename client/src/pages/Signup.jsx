import { Link } from 'react-router-dom';
import { AuthLayout, FormError, SubmitButton, useAuthForm, useRedirectAfterAuth } from './AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const form = useAuthForm({ name: '', email: '', password: '' });
  const redirect = useRedirectAfterAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    form.setPending(true);
    form.setFormError(null);

    try {
      await signup({
        name: form.values.name,
        email: form.values.email,
        password: form.values.password,
      });
      redirect();
    } catch (error) {
      form.applyError(error);
    } finally {
      form.setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      intro="Client accounts get access to project files and meeting notes."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="link-rule text-ink">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError error={form.formError} />

        <Field
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Adaeze Okonkwo"
          value={form.values.name}
          onChange={form.update('name')}
          error={form.fieldErrors.name}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Must be 8 characters or more, and include a letter and a number."
          value={form.values.password}
          onChange={form.update('password')}
          error={form.fieldErrors.password}
        />

        <SubmitButton pending={form.pending} label="Create account" pendingLabel="Creating account" />
      </form>
    </AuthLayout>
  );
}
