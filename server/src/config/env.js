import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Fail fast in production if the signing key is missing. A predictable JWT secret
// means anyone can mint a valid token for any account, so we refuse to boot.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (isProd) {
    throw new Error('JWT_SECRET is required when NODE_ENV=production. Refusing to start.');
  }
  JWT_SECRET = 'dev-only-insecure-secret-do-not-ship';
  console.warn('[env] JWT_SECRET is not set. Using an insecure development fallback.');
}

export const env = {
  NODE_ENV,
  isProd,
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arch_portfolio',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  // Issuer/audience claims stop a token minted for another service from being
  // replayed against this API.
  JWT_ISSUER: 'arch-portfolio-api',
  JWT_AUDIENCE: 'arch-portfolio-client',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
