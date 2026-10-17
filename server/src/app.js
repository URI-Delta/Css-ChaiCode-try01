import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, aiConfigured, paymentsConfigured, isProd } from './config/env.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { sanitizeJson } from './middleware/validate.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind one proxy (e.g. Render/nginx) — correct req.ip

  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));

  app.use(
    cors({
      origin: [env.CLIENT_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
  );

  app.use(express.json({ limit: '512kb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(sanitizeJson);

  app.use('/api/v1', apiLimiter, apiRoutes);

  app.use('/favicon.ico', (_req, res) => res.status(204).end());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
