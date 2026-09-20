/**
 * Post-deployment smoke test.
 *
 * Runs against a deployed API (and optionally the deployed site) and checks the
 * things that actually break in production and that no unit test can see:
 *
 *   - the serverless adapter reaching the database at all
 *   - the JSON error envelope surviving Vercel's rewrite (a bad rewrite answers
 *     with Vercel's own HTML 404 instead of ours)
 *   - CORS allowing the deployed site origin, and still refusing others
 *   - the SPA rewrite serving deep links instead of a 404
 *
 *   npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
 *
 * Exits 0 when everything passes, 1 when anything fails, 2 on bad usage.
 * Dependency-free: uses the global fetch in Node 20+.
 */

const API = (process.argv[2] || '').replace(/\/+$/, '');
const SITE = (process.argv[3] || '').replace(/\/+$/, '');

if (!API) {
  console.error('Usage: npm run smoke -- <api-url> [site-url]');
  console.error('Example: npm run smoke -- https://halden-api.vercel.app https://halden.vercel.app');
  process.exit(2);
}

const password = 'concrete2026';
const email = `smoke+${Date.now()}@halden.test`;

let failures = 0;

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    console.log(`  ok    ${name}${detail ? `  (${detail})` : ''}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}\n          ${error.message}`);
  }
}

async function request(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, contentType: res.headers.get('content-type') || '' };
}

console.log(`\nSmoke test against ${API}${SITE ? ` and ${SITE}` : ''}\n`);

let token = null;

await check('GET /api/health answers ok', async () => {
  const res = await request('GET', '/api/health');
  ok(res.status === 200, `expected 200, got ${res.status} — the API is not reachable`);
  ok(res.json?.status === 'ok', `expected {"status":"ok"}, got ${res.text.slice(0, 120)}`);
  return `uptime ${res.json.uptime}s`;
});

await check('the rewrite reaches Express, not Vercel', async () => {
  const res = await request('GET', '/api/nothing-here');
  ok(res.status === 404, `expected 404, got ${res.status}`);
  ok(
    res.contentType.includes('application/json'),
    `expected a JSON body, got "${res.contentType}" — the request is being answered by Vercel's own 404, so server/vercel.json is not routing to api/index`
  );
  ok(res.json?.error?.code === 'NOT_FOUND', `expected code NOT_FOUND, got ${res.text.slice(0, 120)}`);
});

await check('POST /api/auth/signup creates an account', async () => {
  const res = await request('POST', '/api/auth/signup', {
    body: { name: 'Smoke Test', email, password },
  });
  ok(res.status === 201, `expected 201, got ${res.status}: ${res.text.slice(0, 200)}`);
  ok(typeof res.json?.token === 'string', 'no token in the response');
  ok(res.json?.user?.email === email, `unexpected user email: ${res.json?.user?.email}`);
  ok(!res.text.includes('passwordHash'), 'the response leaked passwordHash');
  token = res.json.token;
  return '201 Created';
});

await check('GET /api/auth/me accepts the token', async () => {
  const res = await request('GET', '/api/auth/me', { token });
  ok(res.status === 200, `expected 200, got ${res.status}: ${res.text.slice(0, 200)}`);
  ok(res.json?.user?.email === email, 'the token resolved to the wrong account');
});

await check('GET /api/auth/me refuses no token', async () => {
  const res = await request('GET', '/api/auth/me');
  ok(res.status === 401, `expected 401, got ${res.status}`);
  ok(res.json?.error?.code === 'NO_TOKEN', `expected code NO_TOKEN, got ${res.text.slice(0, 120)}`);
});

await check('GET /api/auth/me refuses a tampered token', async () => {
  const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
  const res = await request('GET', '/api/auth/me', { token: tampered });
  ok(res.status === 401, `expected 401, got ${res.status} — a modified signature was accepted`);
  ok(res.json?.error?.code === 'BAD_TOKEN', `expected code BAD_TOKEN, got ${res.text.slice(0, 120)}`);
});

await check('POST /api/auth/login returns a token', async () => {
  const res = await request('POST', '/api/auth/login', { body: { email, password } });
  ok(res.status === 200, `expected 200, got ${res.status}: ${res.text.slice(0, 200)}`);
  ok(typeof res.json?.token === 'string', 'no token in the response');
});

await check('POST /api/auth/login refuses a wrong password', async () => {
  const res = await request('POST', '/api/auth/login', { body: { email, password: 'wrong-password-1' } });
  ok(res.status === 401, `expected 401, got ${res.status}`);
  ok(
    res.json?.error?.code === 'INVALID_CREDENTIALS',
    `expected code INVALID_CREDENTIALS, got ${res.text.slice(0, 120)}`
  );
});

if (SITE) {
  await check('CORS preflight allows the deployed site origin', async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: SITE,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    const allow = res.headers.get('access-control-allow-origin');
    ok(
      allow === SITE,
      `expected access-control-allow-origin: ${SITE}, got ${allow ?? 'no header'} — set CLIENT_ORIGIN on the API project to the site URL and redeploy`
    );
    return allow;
  });

  await check('CORS refuses an unknown origin', async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://not-our-site.example',
        'Access-Control-Request-Method': 'POST',
      },
    });
    const allow = res.headers.get('access-control-allow-origin');
    ok(allow !== 'https://not-our-site.example', `the API echoed an origin it should not allow: ${allow}`);
    ok(allow !== '*', 'the API allows every origin (access-control-allow-origin: *)');
  });

  await check('the site serves the app shell', async () => {
    const res = await fetch(`${SITE}/`);
    ok(res.status === 200, `expected 200, got ${res.status}`);
    const html = await res.text();
    ok(html.includes('id="root"'), 'the response is not the React app shell');
    ok(/assets\/index-[\w-]+\.js/.test(html), 'the response has no built JS bundle — is the site built?');
  });

  await check('the site serves a deep link, not a 404', async () => {
    const res = await fetch(`${SITE}/dashboard`);
    ok(res.status === 200, `expected 200, got ${res.status} — client/vercel.json is not rewriting to index.html`);
    const html = await res.text();
    ok(html.includes('id="root"'), 'the deep link did not return the app shell');
  });
}

console.log('');
if (failures === 0) {
  console.log(SITE ? 'All checks passed.\n' : 'All API checks passed. Pass the site URL as a second argument to check the frontend and CORS.\n');
  process.exit(0);
}

console.log(`${failures} check${failures === 1 ? '' : 's'} failed.\n`);
process.exit(1);
