/**
 * Vercel serverless entry point.
 *
 * Vercel does not run a long-lived process, so `src/server.js` (which calls
 * app.listen) cannot be the deployed entry point. Instead the Express app is
 * exported as a request handler. Vercel invokes it with the Node (req, res)
 * signature, which is exactly what an Express app already is.
 *
 * The database connection is cached on globalThis: a warm serverless instance
 * reuses the same process across invocations, and without this cache every
 * request would open a new connection pool until Atlas refused more.
 */
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';

const app = createApp();

async function getConnection() {
  const cached = globalThis.__haldenMongoConnection;
  if (cached) return cached;

  const pending = connectDatabase().catch((error) => {
    // Never cache a failed connection: the next invocation should retry.
    globalThis.__haldenMongoConnection = null;
    throw error;
  });

  globalThis.__haldenMongoConnection = pending;
  return pending;
}

export default async function handler(req, res) {
  try {
    await getConnection();
  } catch (error) {
    console.error('[api] database unavailable:', error.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: { message: 'Database unavailable. Please try again shortly.', code: 'DB_UNAVAILABLE' },
      })
    );
    return;
  }

  return app(req, res);
}
