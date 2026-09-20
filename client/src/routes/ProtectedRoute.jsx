import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps routes that require a signed-in user.
 *
 * Three states, and the loading one matters: while the stored token is being
 * verified we must not redirect, otherwise a refresh would bounce a signed-in
 * user to the login page for a fraction of a second.
 *
 * The destination on failure depends on why the session ended:
 *   - signed out on purpose -> the public homepage, which is where someone who
 *     just clicked "Sign out" expects to land.
 *   - session expired, token invalid, or no session at all -> the sign-in page,
 *     remembering where they were headed so login can return them there.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, signedOutAt } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="shell flex min-h-[100dvh] flex-col justify-center gap-4 pt-24" aria-busy="true">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-10 w-72" />
        <div className="skeleton h-24 w-full max-w-xl" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  if (!user) {
    if (signedOutAt) return <Navigate to="/" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
