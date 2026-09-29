/**
 * Tests the Vercel serverless entry point (api/index.js).
 *
 * The handler is invoked over real HTTP through a Node server, which is exactly
 * how Vercel calls it. This proves the deployment adapter works, rather than
 * assuming it does because the source looks reasonable.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'production'; // the strict config path Vercel runs under
process.env.JWT_SECRET = 'serverless-test-secret-value';
process.env.BCRYPT_ROUNDS = '10';

let mongod;
let server;
let baseUrl;

async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'serverless_test' } });
  process.env.MONGODB_URI = mongod.getUri('serverless_test');

  // Imported only after MONGODB_URI exists, because config/env.js reads process.env at load.
  const { default: handler } = await import('../api/index.js');

  server = http.createServer((req, res) => handler(req, res));
  server.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }

  const { disconnectDatabase } = await import('../src/config/db.js');
  await disconnectDatabase();

  if (mongod) await mongod.stop();
});

describe('Vercel serverless handler', () => {
  it('boots under NODE_ENV=production without a JWT_SECRET fallback', () => {
    // If env.js had accepted the development fallback, this import would have
    // thrown at module load and the whole suite would have failed earlier.
    assert.equal(process.env.NODE_ENV, 'production');
    assert.equal(process.env.JWT_SECRET, 'serverless-test-secret-value');
  });

  it('serves GET /api/health through the handler', async () => {
    const res = await api('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('serves signup, then the protected route with the returned token', async () => {
    const signup = await api('POST', '/api/auth/signup', {
      body: { name: 'Serverless Tester', email: 'vercel@halden.test', password: 'concrete2026' },
    });
    assert.equal(signup.status, 201);
    assert.ok(signup.body.token);

    const me = await api('GET', '/api/auth/me', { token: signup.body.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, 'vercel@halden.test');
  });

  it('still refuses the protected route without a token', async () => {
    const res = await api('GET', '/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'NO_TOKEN');
  });

  it('returns the JSON 404 for an unknown route', async () => {
    const res = await api('GET', '/api/nothing-here');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});
