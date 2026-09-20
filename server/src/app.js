import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Behind a proxy (Render, Railway, Nginx) this makes req.ip the real client IP,
  // which the rate limiter depends on. `1` means "trust exactly one hop".
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Sensible security headers: HSTS, no-sniff, frame denial, and so on.
  app.use(helmet());

  // Only the React app's origin may call this API from a browser.
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  // A small body cap stops anyone posting megabytes of JSON at us.
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
  });

  app.use('/api/auth', authRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
