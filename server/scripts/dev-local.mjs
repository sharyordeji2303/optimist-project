/**
 * Zero-setup local development.
 *
 * Boots a real MongoDB in-process (mongodb-memory-server downloads an official
 * mongod binary on first run), points the API at it, then starts the API.
 *
 * Use this when you have no MongoDB installed and do not want an Atlas account
 * yet. Data lives only for the lifetime of this process.
 *
 * To use a persistent database instead, set MONGODB_URI in .env (a local mongod
 * or a MongoDB Atlas connection string) and run `npm run dev`.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({ instance: { dbName: 'arch_portfolio' } });

process.env.MONGODB_URI = mongod.getUri('arch_portfolio');
console.log(`[dev-db] ephemeral MongoDB running at ${process.env.MONGODB_URI}`);
console.log('[dev-db] data is discarded when this process exits.');

// Imported after MONGODB_URI is set, because env.js reads process.env at load.
await import('../src/server.js');

async function shutdown() {
  await mongod.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
