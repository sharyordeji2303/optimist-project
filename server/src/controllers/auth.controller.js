import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken } from '../utils/token.js';
import { env } from '../config/env.js';

/**
 * A real bcrypt hash of a throwaway string.
 * When an email is unknown we still run one comparison so the response time for
 * "no such account" matches "wrong password". Without this, an attacker can time
 * the endpoint and harvest which emails are registered.
 */
let decoyHash = null;
function getDecoyHash() {
  if (!decoyHash) decoyHash = bcrypt.hashSync('decoy-password-never-used', env.BCRYPT_ROUNDS);
  return decoyHash;
}

/** POST /api/auth/signup */
export async function signup(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: { message: 'An account with that email already exists.', code: 'EMAIL_TAKEN' },
      });
    }

    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json({
      user: user.toPublicJSON(),
      token: signAccessToken(user),
    });
  } catch (err) {
    // Unique index violation: two signups raced for the same email.
    if (err?.code === 11000) {
      return res.status(409).json({
        error: { message: 'An account with that email already exists.', code: 'EMAIL_TAKEN' },
      });
    }
    return next(err);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    // passwordHash is select:false on the schema, so ask for it explicitly.
    const user = await User.findOne({ email }).select('+passwordHash');

    // One identical failure response for unknown email and wrong password, so
    // the API never confirms whether an address is registered.
    const ok = user
      ? await user.verifyPassword(password)
      : await bcrypt.compare(password, getDecoyHash());

    if (!ok || !user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
      });
    }

    return res.json({
      user: user.toPublicJSON(),
      token: signAccessToken(user),
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/auth/me (protected) */
export async function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}
