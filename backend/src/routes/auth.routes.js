import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, me } from '../controllers/auth.controller.js';
import { signupRules, loginRules, validate } from '../validators/auth.validators.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Brute-force dampener.
 * Signup and login share one bucket per IP so an attacker cannot dodge the limit
 * by spreading attempts across the two endpoints.
 */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many attempts from this address. Try again in a few minutes.', code: 'RATE_LIMITED' },
  },
});

export const authRouter = Router();

authRouter.post('/signup', credentialLimiter, signupRules, validate, signup);
authRouter.post('/login', credentialLimiter, loginRules, validate, login);
authRouter.get('/me', requireAuth, me);
