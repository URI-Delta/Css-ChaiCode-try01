import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { log } from './config/logger.js';
import { ensureSeedPlans } from './services/plan.service.js';
import { ensurePlatformConfig } from './services/ai.service.js';
import { ensureSeedAchievements } from './seed/achievements.js';

export async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  await connectDb();
  await ensureSeedPlans();
  await ensurePlatformConfig();
  await ensureSeedAchievements();

  if (process.env.NODE_ENV !== 'test') {
    server.listen(env.PORT, () => {
      log.info(`API listening on port ${env.PORT}`, { env: env.NODE_ENV, client: env.CLIENT_URL });
    });
  }

  // session cleanup every hour
  const cleanup = setInterval(() => {
    import('./jobs/cleanup.js').then((m) => m.runCleanup()).catch(() => {});
  }, 60 * 60 * 1000);
  cleanup.unref();

  const shutdown = async (signal) => {
    log.warn(`Received ${signal} — shutting down gracefully`);
    clearInterval(cleanup);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { app, server };
}

bootstrap().catch((err) => {
  log.error('Fatal bootstrap failure', { message: err.message, stack: err.stack });
  process.exit(1);
});
