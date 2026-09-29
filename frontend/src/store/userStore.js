import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { axiosInstance } from '../api/axios.js';

// Storage can be blocked in private browsing. In that case login still works
// for the current tab, but cannot survive a refresh.
const storage = {
  getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
  setItem: (name, value) => { try { localStorage.setItem(name, value); } catch {} },
  removeItem: (name) => { try { localStorage.removeItem(name); } catch {} },
};

let sessionVersion = 0;
let sessionCheck = null;

export const useUserStore = create(persist((set, get) => ({
  user: null,
  token: storage.getItem('halden.session'), // Keep existing users signed in after this update.
  isLoggedIn: false,
  loading: true,
  signedOutAt: null,

  signup: async (formData) => {
    const response = await axiosInstance.post('/auth/signup', formData);
    sessionVersion++;
    set({ user: response.data.user, token: response.data.token, isLoggedIn: true, loading: false, signedOutAt: null });
    storage.removeItem('halden.session');
    return response.data;
  },

  login: async (formData) => {
    const response = await axiosInstance.post('/auth/login', formData);
    sessionVersion++;
    set({ user: response.data.user, token: response.data.token, isLoggedIn: true, loading: false, signedOutAt: null });
    storage.removeItem('halden.session');
    return response.data;
  },

  logOut: () => {
    sessionVersion++;
    set({ user: null, token: null, isLoggedIn: false, loading: false, signedOutAt: Date.now() });
    storage.removeItem('halden.session');
  },

  // Verify the saved token with the backend before opening protected pages.
  // Share the request when React StrictMode runs the startup effect twice.
  checkSession: () => {
    if (sessionCheck) return sessionCheck;
    const token = get().token;
    if (!token) {
      set({ user: null, isLoggedIn: false, loading: false });
      return Promise.resolve();
    }
    const version = sessionVersion;
    set({ loading: true });
    sessionCheck = axiosInstance.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (version === sessionVersion) set({ user: data.user, isLoggedIn: true });
    }).catch((error) => {
      if (version !== sessionVersion) return;
      if (error.response?.status === 401) {
        set({ token: null });
        storage.removeItem('halden.session');
      }
      set({ user: null, isLoggedIn: false });
    }).finally(() => {
      if (version === sessionVersion) set({ loading: false });
      sessionCheck = null;
    });
    return sessionCheck;
  },
}), {
  name: 'user-storage',
  storage: createJSONStorage(() => storage),
  // A stored user/isLoggedIn flag is not proof that the server accepts a session.
  partialize: (state) => ({ token: state.token }),
}));
