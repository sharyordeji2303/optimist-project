import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Opens the single shared Mongoose connection.
 * Mongoose pools connections internally, so one call per process is correct.
 */
export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => console.log('[db] connection established'));
  mongoose.connection.on('disconnected', () => console.warn('[db] connection lost'));
  mongoose.connection.on('error', (err) => console.error('[db] error:', err.message));

  await mongoose.connect(uri, {
    // Fail fast instead of hanging for 30s when the URI or network is wrong.
    serverSelectionTimeoutMS: 8000,
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
