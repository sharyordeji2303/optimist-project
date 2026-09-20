# How this works, and how to explain it

This is the guide to the project: what each part does, why it was built that way,
and the questions you are most likely to be asked. Read it once end to end, then
use the demo script near the bottom.

---

## 1. The one-paragraph version

It is two applications. The **client** is a React single-page app that renders an
editorial landing page and three auth screens. The **server** is an Express API
that owns the database and the security rules. The client never touches the
database; it asks the API. When you sign up, the client sends your details to the
API, the API hashes the password with bcrypt and stores the user in MongoDB, then
signs a JSON Web Token and returns it. The client stores that token and sends it
on every later request as `Authorization: Bearer <token>`. Any route that needs a
signed-in user runs through one piece of middleware that checks the token before
the request is allowed to continue.

---

## 2. What happens when you press "Create account"

Follow one request all the way through. This is the story to tell.

1. **`Signup.jsx`** collects the three fields and calls `signup()` from the auth
   context. It sets `pending` to true first, so the button shows a spinner and
   cannot be double-submitted.
2. **`AuthContext.jsx`** calls `authApi.signup()`.
3. **`api/client.js`** turns that into `POST /api/auth/signup` with a JSON body.
   Because `VITE_API_URL` is unset in development, the request goes to the same
   origin, `localhost:5173`, and the Vite dev server proxies `/api` to
   `localhost:4000`.
4. **`app.js`** has already applied helmet (security headers), CORS (only the
   client origin may call it) and `express.json` (parses the body, capped at 32 kB).
5. The request reaches **`auth.routes.js`**, which runs three things in order:
   the rate limiter, then the validation rules, then the controller. If the rate
   limiter rejects it, the controller never runs.
6. **`auth.validators.js`** checks the name length, that the email looks like an
   email, and that the password is at least 8 characters with a letter and a
   number. Failures return 422 with a message per field.
7. **`auth.controller.js`** checks no account already exists with that email,
   creates a `User`, and calls `setPassword()`, which hashes the plaintext with
   bcrypt. Only the hash is stored. The plaintext is never written anywhere.
8. **`User.js`** saves the document. The unique index on `email` means the
   database itself refuses a duplicate, so two simultaneous signups cannot both
   succeed.
9. **`utils/token.js`** signs a JWT containing the user id and role, with an
   expiry, an issuer and an audience.
10. The controller returns `201` with the public user object and the token.
    `toPublicJSON()` is the only shape ever sent, so `passwordHash` cannot leak.
11. **`AuthContext.jsx`** stores the token and sets the user. The component
    redirects to `/dashboard`.
12. **`ProtectedRoute.jsx`** allows it, because `user` is now set.

Then, when you refresh the dashboard:

1. `AuthContext` reads the token from `localStorage` on startup.
2. It calls `GET /api/auth/me` with that token to check the session is still real.
3. **`middleware/auth.js`** verifies the signature, the expiry, the issuer and the
   audience, then loads the user from the database.
4. If all good, the dashboard renders. If the token was expired or forged, the
   API returns 401, the context clears the token, and `ProtectedRoute` sends you
   to the sign-in page.

---

## 3. The five decisions you will be asked about

### Why is there an `api/index.js` as well as `src/server.js`?

Both wrap the same Express app for different runtimes. `src/server.js` is the local
entry: it opens the database connection and calls `app.listen()`, which is what you
want on your machine or on a server that stays running. Vercel does not keep a
process alive, so it needs a request handler instead: `api/index.js` exports the
Express app as a function. Vercel calls it with `(req, res)`, which is exactly the
signature an Express app already has, so no adapter library is needed.

The one thing that needs care is the database connection. A warm serverless
instance serves many requests, and opening a new connection pool on every request
would exhaust Atlas. `api/index.js` caches the connection promise on `globalThis`
so the pool is created once, and deliberately does not cache a failed connection,
so the next request retries instead of being stuck forever.

### Why does the frontend need `vercel.json`?

Because the site is a single-page app. All routes are handled in the browser, so
only `/` exists as a real file on the server. Without a rewrite, opening
`/dashboard` directly would ask the host for a file that does not exist and get a
404. The rewrite sends unknown paths to `index.html`, the app boots, and the route
guard decides what to do. Local dev does not need this because Vite already does it.

### Why JWT instead of server sessions?

A session stores the logged-in state on the server: the server keeps a session id
per user in memory or in a session store, and hands the browser a cookie. A JWT
stores the state in the token itself, signed so it cannot be altered. The
practical consequence is that the API does not need to remember anyone. Any server
instance can verify the token on its own, which is why it works well when you
scale to more than one server. The trade-off is that you cannot revoke a JWT the
way you can delete a session. A JWT stays valid until it expires. That is why the
expiry is short (one hour by default) and why the API re-loads the user from the
database on every request, so a deleted account stops working immediately.

### Why bcrypt, and why cost 12?

Passwords must never be stored, or even compared, in plain text. bcrypt is a
deliberately slow hashing function: the "cost" is the number of times the
algorithm runs internally, doubling with each increment. Cost 12 means 2^12
rounds, roughly a quarter of a second on this hardware. That is imperceptible to
one person signing in, and brutal for someone trying billions of guesses. It also
generates a random salt per password, so two users with the same password get
different hashes, and a precomputed lookup table is useless.

### Where is the token stored, and what is the risk?

In `localStorage`, sent as a bearer token. The honest answer about the trade-off:
`localStorage` is readable by JavaScript, so if the site had an XSS vulnerability,
an attacker could steal the token. The stricter alternative is an httpOnly cookie,
which JavaScript cannot read, but then you must add CSRF protection because
cookies are sent automatically. This build chose the bearer approach because the
brief named JWT and it keeps the API stateless. Say the trade-off out loud, that
is stronger than pretending there is none.

### Why does login return the same message for a wrong password and an unknown email?

If the API said "no account with that email", anyone could test email addresses
and build a list of who has an account. That is account enumeration. Both cases
return `401 Invalid email or password`. The controller also hashes a decoy value
when the email is unknown, so the response takes the same amount of time and
cannot be timed either.

### Why is the user reloaded from the database on every protected request?

A JWT proves it was issued by us and has not expired. It does not prove the
account still exists. Without the database lookup, deleting a user would not stop
their existing token from working until it expired. This is also the hook where
you would check a token version or a ban flag later.

---

## 4. Frontend decisions

### Why a separate `editorial.css` at all?

Tailwind is utilities in markup. Some things do not belong in markup: a masonry
layout, custom scrollbars, a multi-step reveal with a delay variable, keyframes
for a marquee. Those live in `editorial.css` as named classes, and Tailwind
handles spacing, colour and responsive utilities. The brief asked for exactly this
split, and it is also the honest division of labour: utilities for what is used
once, CSS for anything reused or stateful.

### Why CSS multi-column for the masonry grid instead of JavaScript?

`column-count` with `break-inside: avoid` gives real masonry with no JavaScript
and no layout measurement. A JavaScript masonry library has to measure every tile,
position it absolutely, re-measure on resize, and it causes layout shift while it
works. The CSS version is one rule and it degrades to a single column on mobile by
itself. The limitation to admit: multi-column fills top to bottom, then across, so
the reading order is vertical rather than left to right.

### Why IntersectionObserver instead of a scroll listener?

A `window.addEventListener('scroll')` handler runs on every scroll frame and
forces the browser to re-check layout each time, which is what makes pages janky
on phones. IntersectionObserver asks the browser to tell us when an element
enters view, and it does that work off the main thread. Each element also
unobserves itself once revealed, so nothing keeps running after the page has been
read.

### Why one easing curve everywhere?

Every transition and animation in the project uses
`cubic-bezier(0.16, 1, 0.3, 1)`. The browser defaults, `linear` and `ease-in-out`,
start and stop abruptly in a way that reads as mechanical. This curve starts fast
and settles gently, like something with weight. Using one curve everywhere is what
makes unrelated interactions feel like they belong to the same product.

### Why does reduced motion matter?

Some people get nauseous or dizzy from movement on screen. The `prefers-reduced-motion`
block at the bottom of `editorial.css` turns off the reveals, the marquee, the
image transitions and the shimmer for anyone whose operating system asks for it.
It is about twelve lines of CSS and it is not optional.

---

## 5. What is in the project but easy to miss

- **Rate limiting.** 20 auth attempts per IP per 15 minutes. Without it, nothing
  stops someone trying passwords at machine speed.
- **Input normalisation.** Emails are trimmed and lowercased, so
  `  Adaeze@STUDIO.example  ` and `adaeze@studio.example` are the same account.
- **Consistent error shape.** Every failure, including a 404, returns the same
  JSON envelope with a machine-readable `code`. The client has one error path
  because of it.
- **The 500 handler never leaks the real message.** Internal errors are logged
  server-side and the client gets a generic line.
- **The token is verified with issuer and audience.** A token minted for a
  different service cannot be replayed here.
- **Loading, empty and error states.** The dashboard has a skeleton while the
  session is checked, the forms show field-level and form-level errors, and the
  404 page exists.

---

## 6. Honest limitations

Say these before you are asked. Naming your own gaps reads as competence.

- **Rate limiting is per IP and in-memory.** On a single server that is exact. On
  Vercel each warm instance keeps its own counter, so the effective limit is
  approximate. A shared store such as Redis is the fix.
- **No refresh tokens.** Access tokens last an hour and then the user signs in
  again. A production build would add a refresh token in an httpOnly cookie.
- **No email verification, no password reset.** Both need an email provider.
- **The token is in `localStorage`**, with the XSS trade-off described above.
- **Rate limiting is per IP, not per account.** A distributed attack from many IPs
  against one account would get through. Account-level lockout is the next step.
- **The tests cover the API, not the UI.** There is no browser test suite.
- **Photographs are placeholders** from picsum.photos. Real project images need to
  replace them in `client/src/data/site.js`.
- **No CI pipeline.** Tests are run locally with `npm test`.
- **Accessibility is designed for, not audited.** Keyboard focus, labels, alt text
  and reduced motion are all handled, but there has been no screen-reader pass.
- **The landing page is a single page.** Real navigation would need more routes.

---

## 7. Five-minute demo script

Run it in this order. It shows the whole system working.

1. **Start both.** Terminal 1 `cd server && npm run dev:local`. Terminal 2
   `cd client && npm run dev`. Open http://localhost:5173.
2. **Walk the landing page.** Point out the hero, the masonry grid, the desaturated
   photographs resolving on hover, and the marquee. Resize the window to show the
   grid stepping from three columns to two to one. Press the theme toggle.
3. **Open DevTools, Network tab.** Refresh. Show the document, the CSS, the JS.
   Point out `editorial.css` rules in the compiled stylesheet.
4. **Attempt a bad signup.** Go to `/signup`, use password `abc`. Show the inline
   field error and the 422 in the Network tab.
5. **Sign up properly.** Land on the dashboard. Point out the details shown are
   what the API returned, not what was typed into the form.
6. **Show the token.** In DevTools, Application, Local Storage. Copy it, paste it
   into jwt.io if you like, and note the payload has a user id and a role but no
   personal data. Explain why: a JWT payload is readable by anyone holding it.
7. **Refresh the dashboard.** You stay signed in. Explain the `/api/auth/me` call
   that just happened.
8. **Break the token.** Edit one character in the stored token, refresh. You are
   sent to sign in. That is the signature check failing, shown live.
9. **Prove the API is actually protected.** From a terminal:

   ```powershell
   curl http://localhost:4000/api/auth/me
   ```

   Show the 401. Then repeat it with a real token in the header and show the 200.
10. **Sign out, then try `/dashboard` directly.** Redirected to sign in.
11. **Run `npm test`** in `server/` and let the suite print. Twenty-four checks
    across two suites, against a real server and a real database.

---

## 8. Terms you should be able to define

**Hashing** turning a value into a fixed-length string that cannot be reversed.
Different from encryption, which can be decrypted. Passwords are hashed, never
encrypted.

**Salt** random data added to a password before hashing, so identical passwords
produce different hashes.

**JWT** three base64 sections separated by dots: header, payload, signature. The
first two are readable by anyone; the signature is what makes it trustworthy.

**Bearer token** a token that grants access to whoever holds it. There is no extra
proof of identity, which is why it must be kept secret and sent over HTTPS.

**Middleware** a function in the request pipeline that can read the request,
change it, end it, or pass it on with `next()`.

**CORS** the browser rule that a page from one origin cannot call another origin
unless that other origin says it may, via headers. The API allowlists one origin.

**Environment variable** configuration kept outside the code, so the same code
runs locally and in production with different settings and secrets.

---

## 9. If you do not know something

Say so, then say how you would find out. For example: "I have not implemented
refresh token rotation, so I could not tell you the exact failure mode. I would
read the OWASP guidance on token storage and then test it." That is a better
answer than a confident guess, and it is the truth.
