import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/axios.js';
import { AuthLayout, FormError, SubmitButton } from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { useUserStore } from '../store/userStore.js';

export default function Signup() {
  const { signup } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
      await signup(formData);
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
        <FormError error={formError} />

        <Field
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Adaeze Okonkwo"
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Must be 8 characters or more, and include a letter and a number."
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <SubmitButton pending={loading} label="Create account" pendingLabel="Creating account" />
      </form>
    </AuthLayout>
  );
}
