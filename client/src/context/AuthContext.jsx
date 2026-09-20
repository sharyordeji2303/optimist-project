import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth as authApi, ApiError } from '../api/client.js';

const TOKEN_KEY = 'halden.session';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user for the whole app.
 *
 * Where the token lives: localStorage, sent on each request as
 * `Authorization: Bearer <token>`.
 *
 * The trade-off, stated plainly because it will be asked about: localStorage is
 * readable by JavaScript, so a cross-site scripting bug would expose the token.
 * The stricter alternative is an httpOnly cookie, which JavaScript cannot read
 * but which then needs CSRF protection. This build chooses the bearer-token
 * approach because it is the one the brief names and it keeps the API stateless.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  // Set when the user signs out on purpose. ProtectedRoute reads it to decide
  // where to send them, which removes the race between "clear the session" and
  // "navigate away" firing in the same render.
  const [signedOutAt, setSignedOutAt] = useState(null);
  // `loading` covers the initial "is this stored token still valid?" check.
  const [loading, setLoading] = useState(Boolean(token));

  const persist = useCallback((nextToken) => {
    setToken(nextToken);
    try {
      if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Private browsing can block storage. The session then simply does not
      // survive a refresh, which is an acceptable degradation.
    }
  }, []);

  // On first load, verify any stored token against the API. A token in storage
  // is not proof of a live session: it may be expired, or the account deleted.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    // Guards against the aborted run of a React StrictMode double-invoke (and any
    // future token change) settling state: without it, an aborted request would
    // still hit `finally`, clear `loading`, and bounce the user to the sign-in
    // page on every hard refresh even though their session is valid.
    let active = true;
    setLoading(true);

    authApi
      .me(token, controller.signal)
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return;
        // Expired or invalid token: clear it rather than looping on 401s.
        if (err instanceof ApiError && err.status === 401) persist(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, persist]);

  const signup = useCallback(
    async (credentials) => {
      const data = await authApi.signup(credentials);
      setSignedOutAt(null);
      persist(data.token);
      setUser(data.user);
      return data.user;
    },
    [persist]
  );

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      setSignedOutAt(null);
      persist(data.token);
      setUser(data.user);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null);
    setUser(null);
    setSignedOutAt(Date.now());
  }, [persist]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signedOutAt,
      signup,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, token, loading, signedOutAt, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}
