/**
 * Integration tests for the authentication API.
 *
 * These run against a real Express server and a real MongoDB (an ephemeral
 * in-process instance), over real HTTP. Nothing is mocked, so a green run means
 * the actual signup/login/protected-route flow works.
 *
 * Run with:  npm test
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set the environment before importing anything that reads config at load time.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret-value';
process.env.BCRYPT_ROUNDS = '10'; // keep the suite fast

let mongod;
let server;
let baseUrl;
let env;

/** Small fetch wrapper that returns { status, body } instead of throwing. */
async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  return { status: res.status, body: parsed };
}

const VALID = {
  name: 'Adaeze Okonkwo',
  email: 'adaeze@studio.example',
  password: 'concrete2026',
};

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'arch_portfolio_test' } });
  process.env.MONGODB_URI = mongod.getUri('arch_portfolio_test');

  // Import after MONGODB_URI is set, because env.js reads process.env at load.
  env = (await import('../src/config/env.js')).env;
  const { connectDatabase } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');

  await connectDatabase(process.env.MONGODB_URI);

  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  // Order matters, and every step is needed for the process to actually exit.
  // `server.close()` alone waits for open keep-alive sockets to drain, and the
  // undici fetch pool holds them open, so the test run would hang forever.
  // closeAllConnections() destroys them; then the database and the in-process
  // mongod are shut down so no handle is left keeping the event loop alive.
  if (server) {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }

  const { disconnectDatabase } = await import('../src/config/db.js');
  await disconnectDatabase();

  if (mongod) await mongod.stop();
});

describe('health', () => {
  it('reports ok', async () => {
    const res = await api('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

describe('POST /api/auth/signup', () => {
  let createdToken;

  it('creates an account and returns a token plus a safe user object', async () => {
    const res = await api('POST', '/api/auth/signup', { body: VALID });

    assert.equal(res.status, 201);
    assert.ok(res.body.token, 'expected a token');
    assert.equal(res.body.user.email, VALID.email);
    assert.equal(res.body.user.name, VALID.name);
    assert.equal(res.body.user.role, 'member');
    assert.ok(res.body.user.id, 'expected an id');
    // The hash must never leave the server.
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(JSON.stringify(res.body).includes('$2'), false, 'response leaked a bcrypt hash');

    createdToken = res.body.token;
  });

  it('issues a token that verifies against the configured secret', async () => {
    const payload = jwt.verify(createdToken, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    assert.ok(payload.sub, 'token should carry a subject (user id)');
    assert.equal(payload.role, 'member');
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await api('POST', '/api/auth/signup', { body: VALID });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'EMAIL_TAKEN');
  });

  it('treats a differently cased duplicate email as the same account', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...VALID, email: 'ADAEZE@Studio.Example' },
    });
    assert.equal(res.status, 409);
  });

  it('rejects a password under 8 characters with a field-level error', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...VALID, email: 'short@studio.example', password: 'ab1' },
    });
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');
    assert.ok(res.body.error.fields.password, 'expected a password error message');
  });

  it('rejects a password with no number', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...VALID, email: 'nonumber@studio.example', password: 'onlyletters' },
    });
    assert.equal(res.status, 422);
    assert.ok(res.body.error.fields.password);
  });

  it('rejects an invalid email', async () => {
    const res = await api('POST', '/api/auth/signup', {
      body: { ...VALID, email: 'not-an-email' },
    });
    assert.equal(res.status, 422);
    assert.ok(res.body.error.fields.email);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for correct credentials', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: VALID.email, password: VALID.password },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('accepts a differently cased email', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: '  Adaeze@STUDIO.example  ', password: VALID.password },
    });
    assert.equal(res.status, 200);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: VALID.email, password: 'wrongpassword1' },
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('returns the identical error for an unknown email, so accounts cannot be enumerated', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: 'nobody@studio.example', password: 'whatever123' },
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(res.body.error.message, 'Invalid email or password.');
  });
});

describe('GET /api/auth/me (protected route)', () => {
  let token;

  before(async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: VALID.email, password: VALID.password },
    });
    token = res.body.token;
  });

  it('returns the current user when a valid token is supplied', async () => {
    const res = await api('GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, VALID.email);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('blocks the request with no token at all', async () => {
    const res = await api('GET', '/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'NO_TOKEN');
  });

  it('blocks a tampered token', async () => {
    const tampered = `${token.slice(0, -3)}xyz`;
    const res = await api('GET', '/api/auth/me', { token: tampered });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'BAD_TOKEN');
  });

  it('blocks a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'admin' }, 'attacker-secret', {
      expiresIn: '1h',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const res = await api('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'BAD_TOKEN');
  });

  it('blocks an expired token', async () => {
    const expired = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'member' }, env.JWT_SECRET, {
      expiresIn: '-10s',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const res = await api('GET', '/api/auth/me', { token: expired });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'BAD_TOKEN');
  });

  it('blocks a valid token whose account no longer exists', async () => {
    const ghost = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'member' }, env.JWT_SECRET, {
      expiresIn: '1h',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const res = await api('GET', '/api/auth/me', { token: ghost });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'USER_GONE');
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404 rather than Express default HTML', async () => {
    const res = await api('GET', '/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});
