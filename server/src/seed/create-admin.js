/** Creates the first admin account using SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 *  Refuses to run in production without an explicitly strong password.
 *  Usage: npm run seed:admin */
import { connectDb, disconnectDb } from '../config/db.js';
import { env, isProd } from '../config/env.js';
import { createAdmin } from './seed.js';

connectDb().then(async () => {
  try {
    if (!env.SEED_ADMIN_EMAIL && isProd) {
      // eslint-disable-next-line no-console
      console.error('Refusing: production admins must be created explicitly with SEED_ADMIN_EMAIL set');
      process.exit(1);
    }
    await createAdmin();
  } finally {
    await disconnectDb();
  }
});
