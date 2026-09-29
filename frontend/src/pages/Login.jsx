import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/axios.js';
import { AuthLayout, FormError, SubmitButton } from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { useUserStore } from '../store/userStore.js';

export default function Login() {
  const { login } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await login(formData);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      setFieldErrors(error.response?.data?.error?.fields || {});
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
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
        <FormError error={formError} />

        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@practice.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <SubmitButton pending={loading} label="Sign in" pendingLabel="Signing in" />
      </form>
    </AuthLayout>
  );
}
