import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Gate for protected routes.
 *
 * Reads `Authorization: Bearer <token>`, verifies it, then re-loads the user.
 * Re-loading matters: a token stays mathematically valid until it expires, so if
 * the account was deleted we must not keep honouring the token.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        error: { message: 'Authentication required.', code: 'NO_TOKEN' },
      });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({
        error: { message: 'Your session expired or the token is invalid. Please sign in again.', code: 'BAD_TOKEN' },
      });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: { message: 'This account no longer exists.', code: 'USER_GONE' },
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
