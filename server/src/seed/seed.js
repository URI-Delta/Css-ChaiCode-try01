import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env, isProd } from '../config/env.js';
import { log } from '../config/logger.js';
import { Track } from '../models/track.model.js';
import { Lesson } from '../models/lesson.model.js';
import { Challenge } from '../models/challenge.model.js';
import { ProjectTemplate } from '../models/project-template.model.js';
import { Plan } from '../models/plan.model.js';
import { User } from '../models/user.model.js';
import { PlatformConfig } from '../models/platform-config.model.js';
import { tracks } from './content/tracks.js';
import { lessons } from './content/lessons.js';
import { challenges } from './content/challenges.js';
import { projects } from './content/projects.js';
import { hashPassword } from '../services/auth.service.js';
import { ensureSeedPlans } from '../services/plan.service.js';

async function upsertBySlug(Model, data, keys = ['slug']) {
  const filter = Object.fromEntries(keys.map((k) => [k, data[k]]));
  const doc = await Model.findOneAndUpdate(filter, { $set: data }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return doc;
}

export async function seed() {
  log.info('Seeding…');

  // plans & platform config
  await ensureSeedPlans();
  const cfg = await PlatformConfig.findOne({ scope: 'ai' });
  if (!cfg) await PlatformConfig.create({ scope: 'ai', quotas: { guest: env.AI_DAILY_QUOTA_GUEST, free: env.AI_DAILY_QUOTA_FREE, pro: env.AI_DAILY_QUOTA_PRO, admin: env.AI_DAILY_QUOTA_ADMIN }, timezone: env.AI_TIMEZONE });

  // tracks
  const trackDocs = [];
  for (const t of tracks) trackDocs.push(await upsertBySlug(Track, t));

  const trackBySlug = Object.fromEntries(trackDocs.map((t) => [t.slug, t]));

  // lessons
  for (const l of lessons) {
    const track = trackBySlug[l.trackSlug];
    if (!track) {
      log.warn('Lesson seed: unknown track', { track: l.trackSlug, lesson: l.slug });
      continue;
    }
    const { trackSlug, ...rest } = l;
    await upsertBySlug(Lesson, { ...rest, trackId: track._id, status: 'published' });
  }
  for (const t of trackDocs) {
    const count = await Lesson.countDocuments({ trackId: t._id });
    await Track.updateOne({ _id: t._id }, { lessonsCount: count });
  }

  // challenges + projects
  for (const c of challenges) await upsertBySlug(Challenge, { ...c, status: 'published' });
  for (const p of projects) await upsertBySlug(ProjectTemplate, { ...p, status: 'published' });

  log.info('Seed complete', {
    tracks: trackDocs.length,
    lessons: lessons.length,
    challenges: challenges.length,
    projects: projects.length,
  });
}

/** Creates the first admin from env (or generates a random password printed once). */
export async function createAdmin() {
  const email = env.SEED_ADMIN_EMAIL;
  if (!email) {
    log.error('Set SEED_ADMIN_EMAIL to create an admin');
    process.exit(1);
  }
  const password = env.SEED_ADMIN_PASSWORD; // may be undefined → generated
  if (!password && isProd) {
    log.error('SEED_ADMIN_PASSWORD is required in production; never seed a public password');
    process.exit(1);
  }
  const plain = password || require('node:crypto').randomBytes(12).toString('hex') + 'Aa';
  const passwordHash = await hashPassword(plain);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name: 'Admin', email, passwordHash, role: 'admin', emailVerified: true }, $setOnInsert: { plan: 'free' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  log.info('Admin ready', { email: user.email });
  if (!password) log.info(`Temporary admin password: ${plain}`); // one-time print
  return user;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('seed.js')) {
  connectDb()
    .then(async () => {
      await seed();
      if (process.argv.includes('--with-admin')) await createAdmin();
      await disconnectDb();
      process.exit(0);
    })
    .catch((err) => {
      log.error('Seed failed', { message: err.message, stack: err.stack });
      process.exit(1);
    });
}
