import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Mints a signed access token.
 * The payload carries the user id (`sub`) and role only. No personal data
 * belongs in a JWT because the payload is readable by anyone holding the token.
 */
export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithm: 'HS256',
  });
}

/**
 * Verifies signature, expiry, issuer and audience.
 * Throws if anything is wrong; the caller turns that into a 401.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithms: ['HS256'],
  });
}
