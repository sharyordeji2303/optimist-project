# How this project follows React 9

Reference: `C:\Users\optimist\React 9\react-class`. The `proj9` folder was empty.
The reference contains React examples, not a backend implementation.

| Class convention | This project |
|---|---|
| `pages/Home.jsx` | The signed-in account page, previously `Dashboard.jsx` |
| `pages/About.jsx` | Separate practice and studio page at `/about` |
| `pages/Login.jsx`, `pages/Signup.jsx` | Local `formData`, `loading`, `handleChange`, and `handleSubmit` |
| `components/Navbar.jsx` | Site navigation, previously `Header.jsx` |
| `components/Loader.jsx` | Loading screen while checking the saved session |
| `api/axios.js` | Shared `axiosInstance` and `getErrorMessage` |
| `store/userStore.js` | Zustand `useUserStore`, `persist`, `user`, `isLoggedIn`, `login`, `signup`, and `logOut` |
| `App.jsx` | `BrowserRouter`, `Routes`, and `Route` |
| `main.jsx` | `StrictMode`, `createRoot`, styles, and `App` |

The public architecture portfolio is now `pages/Landing.jsx`. It still opens at
`/`; the signed-in `Home.jsx` still opens at `/dashboard`, so existing links work.
Shared form presentation lives in `components/AuthLayout.jsx`. Inputs retain
their accessible labels, inline errors, and loading feedback.

## Request flow

1. The page collects `formData` with `useState`.
2. `handleChange` updates the field using `event.target.name` and `value`.
3. `handleSubmit` calls `login(formData)` or `signup(formData)` from the store.
4. The store calls the backend through `axiosInstance` and saves the returned user
   and token. The page navigates after success or shows the server's error.
5. On refresh, `App` calls `checkSession`. The backend verifies the saved token
   before `ProtectedRoute` allows access to `Home`.

## Differences required by this backend

The class example uses another backend with different URLs and response fields.
This project keeps `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, the
`name` signup field, and the `{ user, token }` response. It uses bearer tokens,
not cookies. `VITE_API_URL` still points to your own deployed backend.

Only the token is persisted, rather than trusting a saved `isLoggedIn` flag.
Existing `halden.session` tokens are supported during migration. The reference's
`axiosInstace` typo is not copied. Tailwind and the portfolio visuals stay as they
are; changing Tailwind versions is not necessary to match the class structure.

Run `npm test` and `npm run build` in `frontend` to check this refactor.
