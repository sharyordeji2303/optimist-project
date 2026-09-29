import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();

// Connect before listening so the process never accepts traffic it cannot serve.
try {
  await connectDatabase();
  console.log(`[db] connected to ${env.MONGODB_URI.split('@').pop()}`);
} catch (err) {
  console.error('[db] connection failed:', err.message);
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Close the listener on shutdown so in-flight requests finish and the port is
// released cleanly instead of being killed mid-request.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n[api] ${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
