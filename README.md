# Halden Studio

A full-stack build for the Architectural Portfolio challenge: an editorial landing
page plus a real authentication system.

**New to this project? Read `START-HERE.md` first** — it is the step-by-step
sequence from unzipping to a live deployment. This file is the reference manual.

Two applications live in this repository:

- `client/` React 19 + Tailwind CSS 3 single-page app
- `server/` Express 5 + MongoDB (Mongoose) + JWT API

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Tailwind CSS 3, React Router 7, Vite 8 |
| Custom CSS | `client/src/styles/editorial.css` |
| Backend | Node.js, Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JSON Web Tokens (`jsonwebtoken`), passwords hashed with bcrypt |
| Security | helmet, CORS allowlist, express-rate-limit, express-validator |

---

## Before you start

You need **Node.js 20 or newer** and npm. Check with:

```
node -v
npm -v
```

If `node -v` prints anything below 20, install the current LTS from nodejs.org.

---

## Quick start

The commands below are the same in the macOS Terminal, a Linux shell and Windows
PowerShell. The few places they differ are called out under Troubleshooting.

You need **two terminals open at the same time**: one for the API, one for the site.

### Terminal 1: start the API

```bash
cd server
npm install
npm run dev:local
```

`npm run dev:local` starts a real MongoDB **in-process** and then starts the API on
port 4000. Nothing else to install, no database account needed. The first run
downloads a MongoDB binary (about 100 MB) and takes a minute; after that it starts
in seconds. The download matches your machine, so Apple Silicon and Intel Macs
both get a native binary.

You should see:

```
[dev-db] ephemeral MongoDB running at mongodb://127.0.0.1:XXXXX/arch_portfolio
[db] connection established
[api] listening on http://localhost:4000 (development)
```

Data written this way disappears when you press Ctrl+C. That is expected.

### Terminal 2: start the website

```bash
cd client
npm install
npm run dev
```

Then open **http://localhost:5173**

The Vite dev server proxies `/api` to the Express server, so the browser only ever
talks to one origin and CORS never gets in the way during development.

### Try it

1. Open http://localhost:5173/signup and create an account.
2. You land on the protected dashboard.
3. Press refresh. You stay signed in, because the stored token is re-checked
   against the API on load.
4. Press Sign out, then try to open http://localhost:5173/dashboard directly.
   You are redirected to the sign-in page.

---

## Using a real database instead

The in-process database is for convenience. To use a persistent database, either a
MongoDB server on your machine or a free MongoDB Atlas cluster:

1. In `server/`, copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your connection string.
3. Generate a JWT secret and paste it into `JWT_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Start the API with `npm run dev` instead of `npm run dev:local`.

`npm run dev` expects a database to already exist at `MONGODB_URI`.

---

## Running the tests

```bash
cd server
npm test
```

24 checks across two suites, against a real Express server and a real MongoDB,
driven over HTTP. The first suite covers the authentication API: successful
signup and login, duplicate emails, weak passwords, invalid emails, wrong
passwords, unknown accounts, missing tokens, tampered tokens, tokens signed with
the wrong secret, expired tokens, and tokens whose account has been deleted. The
second suite covers the Vercel serverless entry point, proving the deployment
adapter boots under `NODE_ENV=production` and serves the same routes.

---

## Project structure

```
arch-portfolio/
  client/
    index.html
    vercel.json                 SPA rewrite so deep links do not 404
    tailwind.config.js          design tokens and the fluid type scale
    vite.config.js              dev server plus the /api proxy
    src/
      main.jsx                  entry point, providers, stylesheet imports
      App.jsx                   route map
      index.css                 Tailwind layers and CSS variables
      styles/
        editorial.css           hand-written CSS (see below)
      api/client.js             fetch wrapper and the ApiError shape
      context/AuthContext.jsx   session state, login, signup, logout
      components/
        Header.jsx              floating nav, theme toggle, mobile sheet
        Footer.jsx
        ProjectGrid.jsx         masonry project grid
        Reveal.jsx              IntersectionObserver scroll reveals
        Field.jsx               labelled form field with inline errors
      pages/
        Home.jsx                the landing page
        AuthLayout.jsx          shared shell for the two auth pages
        Login.jsx
        Signup.jsx
        Dashboard.jsx           the protected page
        NotFound.jsx
      routes/ProtectedRoute.jsx the auth gate
  server/
    vercel.json                 routes every path to the serverless function
    api/
      index.js                  Vercel entry point, caches the DB connection
    src/
      server.js                 local entry: connects the database, then listens
      app.js                    middleware, CORS, routes
      config/env.js             validated configuration
      config/db.js              Mongoose connection
      models/User.js            schema, password hashing, safe serialisation
      controllers/auth.controller.js
      routes/auth.routes.js     signup, login, me
      middleware/auth.js        requireAuth guard
      middleware/errorHandler.js
      validators/auth.validators.js
      utils/token.js            sign and verify JWTs
    scripts/dev-local.mjs       zero-setup local database
    scripts/smoke.mjs           post-deployment checks against a live URL
    tests/auth.test.mjs         authentication integration suite
    tests/serverless.test.mjs   Vercel handler suite
```

---

## About `editorial.css`

The brief asked for a custom external stylesheet for things Tailwind does not
express well. It contains:

- custom scrollbars (WebKit and Firefox)
- the masonry grid (`column-count` with `break-inside: avoid`)
- scroll reveal transitions and the staggered delay variable
- the clip-path image wipe, the marquee, and the skeleton shimmer
- the button hover physics and the hamburger-to-cross morph
- one global `prefers-reduced-motion` block that disables all of it

House rule in that file: every transition uses the same easing curve,
`cubic-bezier(0.16, 1, 0.3, 1)`. Nothing uses `linear` or `ease-in-out`.

---

## API reference

Base URL: `http://localhost:4000`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | no | Liveness check |
| POST | `/api/auth/signup` | no | Create an account, returns a token |
| POST | `/api/auth/login` | no | Exchange credentials for a token |
| GET | `/api/auth/me` | yes | Return the signed-in user |

**Signup**

```http
POST /api/auth/signup
Content-Type: application/json

{ "name": "Adaeze Okonkwo", "email": "adaeze@practice.com", "password": "concrete2026" }
```

`201 Created`

```json
{
  "user": { "id": "...", "name": "Adaeze Okonkwo", "email": "adaeze@practice.com", "role": "member", "createdAt": "..." },
  "token": "eyJhbGciOi..."
}
```

**Protected route**

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Errors** always use one shape:

```json
{ "error": { "message": "Human readable", "code": "MACHINE_CODE", "fields": { "email": "Per-field message" } } }
```

| Status | Code | When |
|---|---|---|
| 401 | `NO_TOKEN` | No Authorization header |
| 401 | `BAD_TOKEN` | Invalid, tampered or expired token |
| 401 | `USER_GONE` | Token valid but the account was deleted |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 409 | `EMAIL_TAKEN` | Email already registered |
| 422 | `VALIDATION_FAILED` | Field errors, see `error.fields` |
| 429 | `RATE_LIMITED` | More than 20 auth attempts per IP per 15 minutes |

---

## Environment variables

`server/.env`

| Name | Default | Notes |
|---|---|---|
| `PORT` | `4000` | |
| `NODE_ENV` | `development` | `production` requires a real `JWT_SECRET` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/arch_portfolio` | Atlas string goes here |
| `JWT_SECRET` | dev fallback | Boot fails in production if missing |
| `JWT_EXPIRES_IN` | `1h` | |
| `BCRYPT_ROUNDS` | `12` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Comma-separated allowlist |

`client/.env` is only needed if the API is not at `localhost:4000`:

| Name | Notes |
|---|---|
| `VITE_API_URL` | Leave unset in development. Set to the deployed API in production. |

---

## Deployment on Vercel

The app is deployed as **two Vercel projects from this one repository**: one for
the API and one for the site. Vercel cannot run a long-lived Express process, so
the API is served as a serverless function instead. That adapter already exists at
`server/api/index.js` and is covered by tests.

The database still has to live somewhere. Vercel does not host databases, so
**MongoDB Atlas is required** for a deployment.

### Step 1: MongoDB Atlas

1. Create a free cluster at mongodb.com/atlas.
2. Add a database user (note the username and password).
3. Under Network Access, allow `0.0.0.0/0` for a demo (or your host's IP range).
4. Copy the connection string and add the database name:

   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/arch_portfolio?retryWrites=true&w=majority
   ```

### Step 2: API project on Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New Project** and import the repository.
3. Set **Root Directory** to `server`.
4. Framework preset: **Other**. Leave the build command empty.
5. Add these environment variables:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | the Atlas string from Step 1 |
   | `JWT_SECRET` | a long random string (see below) |
   | `JWT_EXPIRES_IN` | `1h` |
   | `BCRYPT_ROUNDS` | `12` |
   | `CLIENT_ORIGIN` | the site URL from Step 3, once you have it |

   Generate the secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

6. Deploy. Test it at `https://YOUR-API.vercel.app/api/health`, which should
   return `{"status":"ok"}`.

The serverless entry point caches the database connection between invocations, so
a warm instance reuses one connection pool instead of opening a new one per
request. Each instance caps its pool at 10 connections (`server/src/config/db.js`)
rather than the driver default of 100, because several warm instances would
otherwise be able to exhaust an Atlas Free cluster's 500-connection limit.

### Step 3: Site project on Vercel

1. **Add New Project** again, same repository.
2. Set **Root Directory** to `client`.
3. Vercel detects Vite. Build command `npm run build`, output directory `dist`.
4. Add one environment variable: `VITE_API_URL` set to the API URL from Step 2,
   for example `https://YOUR-API.vercel.app` (no trailing slash). Vite inlines
   this value at build time, so changing it later needs a redeploy, not just a
   restart.
5. Deploy, then go back to the API project and set `CLIENT_ORIGIN` to this site
   URL so CORS allows it. Redeploy the API after changing it.

`client/vercel.json` contains the rewrite that sends unknown paths to
`index.html`. Without it, opening `/dashboard` directly in production would 404
instead of loading the app and letting the route guard do its job.

### Step 4: verify the deployment

`server/scripts/smoke.mjs` checks a live deployment over HTTP. Run it once both
projects are deployed, passing the site URL as the second argument:

```bash
cd server
npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
```

It checks the API is reachable and talking to the database, that signup, login
and the protected route work, that a tampered token is refused, that unknown
routes return our JSON 404 rather than Vercel's HTML one (which is what a broken
rewrite looks like), that CORS allows the deployed site origin and still refuses
others, and that a deep link such as `/dashboard` serves the app instead of
404ing.

Every line prints `ok` or `FAIL` with the reason. It exits non-zero if anything
fails, so it can be pasted into a CI job later. With no site URL it checks the
API only.

### Environment variables, quick reference

`server` project: `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`BCRYPT_ROUNDS`, `CLIENT_ORIGIN`.

`client` project: `VITE_API_URL`.

Never commit `.env`. `.gitignore` already excludes it.

---

## Troubleshooting

**`Cannot reach the server. Check that the API is running.`**
The API terminal is not running, or it crashed. Check Terminal 1.

**`Port 4000 is already in use`**
Another process has the port. Find and stop it, or change `PORT` in `server/.env`.

- macOS and Linux: `lsof -ti :4000 | xargs kill`
- Windows: `netstat -ano | findstr :4000`, then `taskkill /PID <pid> /F`

**`Port 5173 is already in use`**
Vite will offer the next free port. Accept it, and note the URL it prints.

**A firewall prompt on first run**
Allow Node.js to accept incoming connections on private networks. This is the
local dev server only, and the site stays reachable at http://localhost:5173
either way. macOS asks the same question the first time you run it.

**`npm install` fails with EPERM or permission errors**
Close any editor holding files in the folder, then run the install again. Avoid
running npm from a cloud-synced folder: OneDrive on Windows, or iCloud Drive
(`~/Documents` and `~/Desktop`, when Desktop & Documents sync is on) on macOS.
Both hold locks on files while they sync.

**First `npm run dev:local` is slow**
It is downloading a MongoDB binary. It is cached, so the second run is fast.

**`npm run dev:local` cannot start the database on macOS**
The in-process database downloads MongoDB 8.x, and MongoDB supports that version
on macOS 14 and later. On an older macOS, or if the download is blocked, use a
real database instead: set `MONGODB_URI` and run `npm run dev` (see "Using a real
database instead"). The API itself runs on any macOS version Node 20 supports.

**`npm ci` prints `allow-scripts` warnings about `mongodb-memory-server`**
Harmless. That package downloads its MongoDB binary when the app starts, not at
install time, so the warning changes nothing.

**`[env] JWT_SECRET is not set` on startup**
Expected in development. The API uses a throwaway secret so the project runs with
no setup. Set a real `JWT_SECRET` in `server/.env` before deploying anywhere
public, because in production the server refuses to start without one.

**The MongoDB download fails behind a firewall**
Use a real database instead: follow the Atlas steps above and run `npm run dev`.

---

## Notes on the design

The landing page follows an editorial direction: a fluid type scale, a masonry
project grid, generous whitespace, and one accent colour. Photographs are
desaturated until hovered so the grid reads as a single composition.

## Photographs

Every image path lives in `client/src/data/site.js`: the six project images plus
the hero, the statement band and the sign-in panel. They point into
`client/public/projects/`, which Vite serves from the site root, so the same path
works in development and in a build, and there is no import to keep in sync.

The files committed there are **generated tonal placeholders, not photographs**.
Replace each one with a real photograph of the same file name and nothing else
changes: no code edit, no path to update. Keep the dimensions close to the
originals so the masonry grid keeps its rhythm.

| File | Size | Used by |
|---|---|---|
| `perch-wharf.jpg` | 900 × 1125 | project tile, 4:5 |
| `umunna-hall.jpg` | 1200 × 800 | project tile, 3:2 |
| `feddan-house.jpg` | 900 × 1200 | project tile, 3:4 |
| `kelvedon-archive.jpg` | 1000 × 1000 | project tile, 1:1 |
| `ten-bell-lane.jpg` | 1100 × 880 | project tile, 5:4 |
| `st-augustine-yard.jpg` | 900 × 1350 | project tile, 2:3 |
| `hero-courtyard.jpg` | 1000 × 1250 | landing hero |
| `statement-stair.jpg` | 1800 × 1000 | full-bleed statement band |
| `auth-facade.jpg` | 1400 × 1800 | sign-in / sign-up panel |

Tiles are cropped with `object-cover`, so a replacement only has to match the
aspect ratio, not the exact pixel count. A photograph that is far smaller than
the original will look soft on a large display.
