# Start here

You have `arch-portfolio.zip`. This is the order to do things in. Every step says
how to know it worked — if it did not, fix it before moving on.

Budget about an hour, most of it waiting for downloads and deploys.

**You need two things before you start:**

1. **Node.js 20 or newer.** Open Terminal and run `node -v`. If it prints nothing,
   or a number below 20, install the current LTS from https://nodejs.org.
2. **The photographs** you want the site to show. If you do not have them yet, do
   steps 1 and 2 now, then come back to step 3 before deploying.

`README.md` is the reference manual. `DEFENSE.md` is how to explain the project
when you are asked about it. This file is just the sequence.

---

## 1. Unzip it

Do **not** unzip inside `Desktop` or `Documents` — those are synced to iCloud, and
iCloud holds locks on files while it syncs, which makes `npm install` fail in
confusing ways. Make a plain folder instead.

```bash
mkdir -p ~/code
cd ~/code
mv ~/Downloads/arch-portfolio.zip .   # or wherever you saved it
unzip arch-portfolio.zip
cd arch-portfolio
ls
```

**Worked if** `ls` shows `client`, `server`, `README.md`, `DEFENSE.md` and this
file. Every command from here on assumes you are in `~/code/arch-portfolio` or a
subfolder of it.

---

## 2. Run it on your own machine

You need **two Terminal windows open at the same time** — one for the API, one for
the website.

**Window 1 — the API:**

```bash
cd ~/code/arch-portfolio/server
npm install
npm run dev:local
```

The first run downloads a MongoDB binary (about 100 MB) and takes a minute.

**Worked if** you see these lines among the output:

```
[dev-db] ephemeral MongoDB running at mongodb://127.0.0.1:XXXXX/arch_portfolio
[db] connection established
[api] listening on http://localhost:4000 (development)
```

A line reading `[env] JWT_SECRET is not set. Using an insecure development
fallback.` is expected and fine. It is the development-only secret; production
refuses to start without a real one, which step 6 covers.

Leave this window running. Data disappears when you press Ctrl+C — that is
expected, it is a throwaway database.

**Window 2 — the website:** press Cmd+N for a new window, then:

```bash
cd ~/code/arch-portfolio/client
npm install
npm run dev
```

**Worked if** it prints a line with `http://localhost:5173`.

**Now test it properly.** Open http://localhost:5173 and:

1. Click **Sign in** → **Create one** → make an account. You should land on the
   dashboard, showing the details you typed.
2. **Refresh the page.** You should stay signed in.
3. Click **Sign out**, then go directly to http://localhost:5173/dashboard. You
   should be sent back to the sign-in page.

If all three behave, the whole system works. Nothing else can be wrong later that
was not wrong here.

---

## 3. The photographs (optional)

The site ships with nine generated placeholders — tonal architectural studies,
one per slot, drawn in the site's own palette. They are **not** photographs of
built work, and they are deliberately graphic so nobody mistakes them for it.

Keeping them is a legitimate choice, and it is what this build does by default.
If you keep them, say so when you present the project rather than letting it be
noticed: `DEFENSE.md` §6 has the wording, and the short version is that inventing
photo-real imagery and labelling it as specific real projects would misrepresent
someone else's buildings.

If you would rather use real photographs, open `client/public/projects/` in
Finder and overwrite these files, **keeping the exact same file names**:

| File name | Size | Shape | What it is |
|---|---|---|---|
| `perch-wharf.jpg` | 900×1125 | tall | project tile |
| `umunna-hall.jpg` | 1200×800 | wide | project tile |
| `feddan-house.jpg` | 900×1200 | tall | project tile |
| `kelvedon-archive.jpg` | 1000×1000 | square | project tile |
| `ten-bell-lane.jpg` | 1100×880 | wide | project tile |
| `st-augustine-yard.jpg` | 900×1350 | tall | project tile |
| `hero-courtyard.jpg` | 1000×1250 | tall | big image on the landing page |
| `statement-stair.jpg` | 1800×1000 | very wide | full-width band mid-page |
| `auth-facade.jpg` | 1400×1800 | tall | panel beside the sign-in form |

**Worked if** you refresh http://localhost:5173 with Cmd+Shift+R and see your
photographs in the grid instead of the drawn ones.

Tiles are cropped to fit, so the shape matters more than the pixel count. A photo
much smaller than 1000px wide will look soft on a large screen.

You can do this at any point, before or after deploying — but if you do it after,
commit and push so Vercel rebuilds with the new images.

---

## 4. Create the two free accounts

**MongoDB Atlas** — the database. https://www.mongodb.com/cloud/atlas/register

1. Sign up, then **Create** a cluster. Choose the **Free** tier (M0, 512 MB). It
   never expires.
2. **Database Access** → **Add New Database User**. Give it a username and click
   **Autogenerate Secure Password**, then **copy the password somewhere**. Avoid
   characters like `@ : / ? # %` in the password — they break the connection
   string unless you escape them.
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`). Vercel has no fixed IP addresses, so this is required.
4. **Connect** → **Drivers** → copy the connection string. It looks like:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

   Insert the database name before the `?`:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.abcde.mongodb.net/arch_portfolio?retryWrites=true&w=majority
   ```

   Replace `USER` and `PASSWORD` with what you created. **This whole string is one
   of the values you will paste into Vercel in step 6 — keep it handy.**

**GitHub** — where the code lives. https://github.com/signup

**Vercel** — the hosting. https://vercel.com/signup — sign up **with your GitHub
account** so the next step is one click.

---

## 5. Push the project to GitHub

Vercel deploys from a repository, so the code has to be on GitHub first.

1. Create an empty repository at https://github.com/new. Name it
   `arch-portfolio`. **Do not** add a README, .gitignore or licence — the project
   already has them.
2. Back in Terminal (any window, and stop the dev servers first with Ctrl+C in
   both):

   ```bash
   cd ~/code/arch-portfolio
   git remote add origin https://github.com/YOUR-USERNAME/arch-portfolio.git
   git branch -M main
   git push -u origin main
   ```

3. It will ask for a username and password. GitHub no longer accepts your account
   password here. Either install the GitHub CLI and log in once —

   ```bash
   brew install gh
   gh auth login
   ```

   — or create a Personal Access Token at
   https://github.com/settings/tokens (scope: `repo`) and paste **that** as the
   password.

**Worked if** the push completes and refreshing the GitHub page shows the folders
`client` and `server`. If it failed on authentication, that is the token step
above and nothing else.

---

## 6. Deploy the API

In Vercel: **Add New Project** → import `arch-portfolio`.

On the configuration screen, before you click Deploy:

- **Root Directory** → Edit → `server`
- **Framework Preset** → `Other`
- **Build Command** → leave empty
- **Output Directory** → leave empty

Then open **Environment Variables** and add these five:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | the Atlas string from step 4 |
| `JWT_SECRET` | see below |
| `JWT_EXPIRES_IN` | `1h` |
| `BCRYPT_ROUNDS` | `12` |

For `JWT_SECRET`, generate a long random string in Terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do not skip this one. In production the server refuses to start without it, on
purpose — a guessable secret would let anyone forge a login.

Click **Deploy**, then open `https://YOUR-API.vercel.app/api/health`.

**Worked if** the browser shows `{"status":"ok","uptime":...}`. If you get Vercel's
own 404 page instead, the Root Directory is wrong.

Copy that API URL. You need it twice more.

---

## 7. Deploy the website

**Add New Project** again, same repository, and this time:

- **Root Directory** → `client`
- **Framework Preset** → `Vite` (Vercel detects this automatically)
- **Build Command** → `npm run build`
- **Output Directory** → `dist`
- **Environment Variables** → one:

| Name | Value |
|---|---|
| `VITE_API_URL` | your API URL from step 6, e.g. `https://arch-portfolio-api.vercel.app` |

No trailing slash. Click **Deploy**.

**Worked if** the site URL loads the landing page with your photographs in it.
Signing up will still fail — that is expected, and step 8 fixes it.

Copy the site URL. It is the last piece.

---

## 8. Connect the two

Right now the API does not know the website is allowed to talk to it, so the
browser blocks every request. Fix that:

1. Go to your **API** project on Vercel → **Settings** → **Environment Variables**.
2. Add `CLIENT_ORIGIN` with the **site URL from step 7**, exactly as it appears:
   `https://arch-portfolio.vercel.app` — no trailing slash.
3. Go to **Deployments** → the most recent one → **⋯** → **Redeploy**.

**Worked if** you open the site, create an account, and land on the dashboard. The
database is now live and the two halves are talking.

---

## 9. Prove the deployment

One command checks everything, including things you cannot see by clicking around.

```bash
cd ~/code/arch-portfolio/server
npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
```

**Worked if** every line starts with `ok`. It checks the API is up and reaching the
database, that signup, login and the protected route work, that a tampered token
is refused, that unknown routes return JSON rather than Vercel's HTML 404, that
CORS allows your site and refuses others, and that a deep link like `/dashboard`
loads the app instead of 404ing.

Any `FAIL` line tells you exactly what is wrong. The most common one is CORS —
that means `CLIENT_ORIGIN` in step 8 does not match the site URL character for
character, or you forgot to redeploy the API after setting it.

---

## 10. Before you submit

- [ ] Photographs: either real ones in place, or you can say out loud that the
      nine drawn studies are placeholders and why (`DEFENSE.md` §6)
- [ ] Both URLs open in a private window (so you are not signed in already)
- [ ] Sign up, refresh, sign out, and try `/dashboard` signed out — on the live site
- [ ] `npm run smoke` all green
- [ ] Read `DEFENSE.md` §6 "Honest limitations" so you can name the gaps before you
      are asked. Saying "no refresh tokens, the token lives in localStorage with
      the usual XSS trade-off" reads far better than being caught by it.

---

## If something goes wrong

`README.md` has a Troubleshooting section covering the usual suspects: a port
already in use, `npm install` permission errors, the first run being slow, and the
local database needing macOS 14 or newer.

Two other things worth knowing:

- **Changing code later:** commit and push, and Vercel redeploys both projects
  automatically. Nothing to click.
- **`npm run dev:local` will not start on an old macOS.** The in-process database
  needs macOS 14+. If your Mac is older, use the Atlas database you made in step 4
  for local development too: copy `server/.env.example` to `server/.env`, paste the
  connection string into `MONGODB_URI`, and run `npm run dev` instead.
