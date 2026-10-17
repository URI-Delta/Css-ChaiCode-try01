import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { audit, auditOn } from '../middleware/audit.js';
import { User } from '../models/user.model.js';
import { Track } from '../models/track.model.js';
import { Lesson } from '../models/lesson.model.js';
import { Challenge } from '../models/challenge.model.js';
import { ProjectTemplate } from '../models/project-template.model.js';
import { Plan } from '../models/plan.model.js';
import { PlatformConfig } from '../models/platform-config.model.js';
import { AuditLog } from '../models/audit-log.model.js';
import { AIUsage } from '../models/ai-usage.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ChallengeAttempt } from '../models/challenge-attempt.model.js';
import { UserProject } from '../models/user-project.model.js';
import { LessonProgress } from '../models/lesson-progress.model.js';
import { notFound, badRequest } from '../config/errors.js';
import { slugify } from '../utils/slug.js';
import { parsePagination, paginatedRes } from '../utils/pagination.js';
import * as tokens from '../services/token.service.js';

const router = Router();
router.use(authenticate, authorize());

/* ── overview ──────────────────────────────────────────────── */
router.get(
  '/overview',
  asyncWrap(async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [users, newUsers, activeUsers, admins, pros, lessons, challenges, attempts, aiToday, aiTotal, projects] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ plan: 'pro' }),
      User.countDocuments({ role: 'admin' }),
      Lesson.countDocuments({ status: 'published' }),
      Challenge.countDocuments({ status: 'published' }),
      ChallengeAttempt.countDocuments({ attemptedAt: { $gte: today } }),
      AIUsage.aggregate([{ $match: { date: { $gte: today } } }, { $group: { _id: null, requests: { $sum: '$requests' }, cost: { $sum: '$estimatedCostUsd' } } }]),
      AIUsage.aggregate([{ $group: { _id: null, requests: { $sum: '$requests' }, cost: { $sum: '$estimatedCostUsd' } } }]),
      UserProject.countDocuments(),
    ]);
    const recentAudit = await AuditLog.find({}).sort('-at').limit(10).select('-metadata').lean();
    res.json({
      ok: true,
      overview: {
        users: { total: users, newLast7: newUsers, activeLast7: activeUsers, pro: pros, admins },
        content: { lessons, challenges, projects },
        today: { challengeAttempts: attempts, aiRequests: aiToday[0]?.requests ?? 0, aiCostUsd: aiToday[0]?.cost ?? 0 },
        aiTotal: { requests: aiTotal[0]?.requests ?? 0, costUsd: aiTotal[0]?.cost ?? 0 },
        recentAudit,
      },
    });
  })
);

/* ── users ─────────────────────────────────────────────────── */
router.get(
  '/users',
  asyncWrap(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const filter = {};
    if (req.query.q) filter.$or = [{ name: new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
    if (req.query.plan) filter.plan = req.query.plan;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    const sort = req.query.sort === 'oldest' ? 'createdAt' : '-createdAt';
    const [items, total] = await Promise.all([User.find(filter).sort(sort).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
    res.json(paginatedRes(items.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, plan: u.plan, status: u.status, emailVerified: u.emailVerified, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt })), total, { page, limit }));
  })
);

router.get(
  '/users/:id',
  asyncWrap(async (req, res) => {
    const [u, lessonsCompleted, challengesPassed, projects, sub] = await Promise.all([
      User.findById(req.params.id).lean(),
      LessonProgress.countDocuments({ userId: req.params.id, completed: true }),
      ChallengeAttempt.countDocuments({ userId: req.params.id, passed: true }),
      UserProject.countDocuments({ userId: req.params.id }),
      Subscription.findOne({ userId: req.params.id }).sort('-createdAt').lean(),
    ]);
    if (!u) throw notFound('User not found');
    res.json({
      ok: true,
      user: { id: u._id, name: u.name, email: u.email, role: u.role, plan: u.plan, status: u.status, emailVerified: u.emailVerified, bio: u.bio, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt },
      stats: { lessonsCompleted, challengesPassed, projects },
      subscription: sub && { status: sub.status, provider: sub.provider, currentPeriodEnd: sub.currentPeriodEnd },
    });
  })
);

const patchUserSchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  plan: z.enum(['free', 'pro']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  suspendedReason: z.string().max(300).optional(),
});

router.patch(
  '/users/:id',
  auditOn('user.update', 'user', (req) => ({ targetId: req.params.id, metadata: { changes: req.body } })),
  validate({ body: patchUserSchema }),
  asyncWrap(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw notFound('User not found');
    // safety: demoting or suspending the last admin would lock out admin access
    if (req.body.role === 'user' && target.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', status: 'active' });
      if (admins <= 1) throw badRequest('Cannot demote the only remaining admin');
    }
    if (req.body.role && !req.user) return res.status(401).json({ ok: false });

    const protectedWarn = [];
    if (req.body.plan) {
      target.plan = req.body.plan;
      protectedWarn.push('plan');
      if (req.body.plan === 'pro') {
        const Plan = (await import('../models/plan.model.js')).Plan;
        const pro = await Plan.findOne({ name: 'pro' });
        if (pro) {
          await (await import('../models/subscription.model.js')).Subscription.create({
            userId: target._id,
            planId: pro._id,
            planName: 'pro',
            provider: 'stripe',
            status: 'active',
            history: [{ at: new Date(), event: 'admin-grant', note: `Granted by ${req.user.email}` }],
          }).catch(() => {});
        }
      }
    }
    if (req.body.status) {
      target.status = req.body.status;
      target.suspendedReason = req.body.status === 'suspended' ? req.body.suspendedReason || undefined : undefined;
    }
    if (req.body.role) target.role = req.body.role;
    await target.save();
    if (req.body.status === 'suspended') await tokens.revokeAllUserSessions(target._id);
    if (target.role === 'admin' && tokens.revokeAllUserSessions) await tokens.revokeAllUserSessions(target._id);
    audit(req.user, 'user.update', 'user', target._id, { patch: Object.keys(req.body) }).catch(() => {});
    res.json({ ok: true, user: { id: target._id, name: target.name, email: target.email, role: target.role, plan: target.plan, status: target.status } });
  })
);

/* ── content management ────────────────────────────────────── */

const trackSchema = z.object({ _id: z.string().optional(), title: z.string().min(2).max(120), slug: z.string().max(140).optional(), description: z.string().max(2000).optional(), emoji: z.string().max(8).optional(), order: z.number().int().optional(), accessLevel: z.enum(['free', 'pro']).optional(), published: z.boolean().optional() });

router.post(
  '/tracks',
  auditOn('track.create', 'track'),
  validate({ body: trackSchema }),
  asyncWrap(async (req, res) => {
    const body = { ...req.body, slug: req.body.slug || slugify(req.body.title) };
    const doc = await Track.create(body);
    res.status(201).json({ ok: true, track: doc });
  })
);

router.patch(
  '/tracks/:id',
  auditOn('track.update', 'track'),
  validate({ body: trackSchema.partial() }),
  asyncWrap(async (req, res) => {
    const doc = await Track.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!doc) throw notFound('Track not found');
    res.json({ ok: true, track: doc });
  })
);

const lessonSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2).max(160),
  slug: z.string().max(180).optional(),
  trackId: z.string(),
  order: z.number().int(),
  description: z.string().max(2000).optional(),
  objectives: z.array(z.string().max(200)).max(10).optional(),
  status: z.enum(['draft', 'published']).optional(),
  accessLevel: z.enum(['free', 'pro']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedMinutes: z.number().int().optional(),
  content: z.string().max(80_000).optional(),
  codeExamples: z.array(z.any()).max(20).optional(),
  quiz: z.array(z.any()).max(20).optional(),
  visualizer: z.string().max(60).optional(),
  visualizerConfig: z.any().optional(),
});

router.post(
  '/lessons',
  auditOn('lesson.create', 'lesson'),
  validate({ body: lessonSchema }),
  asyncWrap(async (req, res) => {
    const body = { ...req.body, slug: req.body.slug || slugify(req.body.title) };
    if (body.content && body.content.length > 60_000) throw badRequest('Lesson content too large');
    const doc = await Lesson.create(body);
    await Track.findByIdAndUpdate(body.trackId, { $inc: { lessonsCount: 1 } });
    res.status(201).json({ ok: true, lesson: doc });
  })
);

router.patch(
  '/lessons/:id',
  auditOn('lesson.update', 'lesson'),
  validate({ body: lessonSchema.partial() }),
  asyncWrap(async (req, res) => {
    const doc = await Lesson.findById(req.params.id);
    if (!doc) throw notFound('Lesson not found');
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ ok: true, lesson: doc });
  })
);

router.delete(
  '/lessons/:id',
  auditOn('lesson.delete', 'lesson'),
  asyncWrap(async (req, res) => {
    const doc = await Lesson.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound('Lesson not found');
    res.json({ ok: true });
  })
);

router.post(
  '/lessons/reorder',
  auditOn('lesson.reorder', 'lesson'),
  validate({ body: z.object({ items: z.array(z.object({ id: z.string(), order: z.number().int()})).min(1).max(200) }) }),
  asyncWrap(async (req, res) => {
    for (const it of req.body.items) await Lesson.updateOne({ _id: it.id }, { $set: { order: it.order } });
    res.json({ ok: true });
  })
);

/* challenges */
const challengeSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  accessLevel: z.enum(['free', 'pro']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  instructions: z.string().optional(),
  starter: z.any().optional(),
  target: z.any().optional(),
  validation: z.any().optional(),
  hints: z.array(z.string().max(400)).optional(),
  solution: z.string().optional(),
  points: z.number().int().optional(),
});

router.post(
  '/challenges',
  auditOn('challenge.create', 'challenge'),
  validate({ body: challengeSchema }),
  asyncWrap(async (req, res) => {
    const doc = await Challenge.create({ ...req.body, slug: req.body.slug || slugify(req.body.title) });
    res.status(201).json({ ok: true, challenge: doc });
  })
);

router.patch(
  '/challenges/:id',
  auditOn('challenge.update', 'challenge'),
  validate({ body: challengeSchema.partial() }),
  asyncWrap(async (req, res) => {
    const doc = await Challenge.findById(req.params.id);
    if (!doc) throw notFound('Challenge not found');
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ ok: true, challenge: doc });
  })
);

/* projects templates */
const templateSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  difficulty: z.string().optional(),
  accessLevel: z.enum(['free', 'pro']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  starterFiles: z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional() }).optional(),
  hints: z.array(z.string()).optional(),
  solution: z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional() }).optional(),
  order: z.number().int().optional(),
});

router.post(
  '/projects',
  auditOn('project.create', 'project'),
  validate({ body: templateSchema }),
  asyncWrap(async (req, res) => {
    const doc = await ProjectTemplate.create({ ...req.body, slug: req.body.slug || slugify(req.body.title) });
    res.status(201).json({ ok: true, template: doc });
  })
);

router.patch(
  '/projects/:id',
  auditOn('project.update', 'project'),
  validate({ body: templateSchema.partial() }),
  asyncWrap(async (req, res) => {
    const doc = await ProjectTemplate.findById(req.params.id);
    if (!doc) throw notFound('Project not found');
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ ok: true, template: doc });
  })
);

/* lists for admin content UIs (incl. drafts) */
router.get(
  '/content',
  asyncWrap(async (_req, res) => {
    const [tracks, lessons, challenges, projects] = await Promise.all([
      Track.find().sort('order').lean(),
      Lesson.find({}, 'title slug trackId order status accessLevel difficulty').sort('trackId order').lean(),
      Challenge.find({}, 'title slug type difficulty status accessLevel points').sort('difficulty').lean(),
      ProjectTemplate.find({}, 'title slug difficulty status accessLevel order').sort('order').lean(),
    ]);
    res.json({ ok: true, tracks, lessons, challenges, projects });
  })
);

/* ── plans & AI config ─────────────────────────────────────── */
router.get(
  '/plans',
  asyncWrap(async (_req, res) => {
    const plans = await Plan.find().sort('order').lean();
    const cfg = await PlatformConfig.findOne({ scope: 'ai' }).lean();
    res.json({ ok: true, plans, aiConfig: cfg });
  })
);

router.patch(
  '/plans/:id',
  auditOn('plan.update', 'plan'),
  validate({ body: z.object({ title: z.string().max(80).optional(), price: z.number().min(0).max(100_000).optional(), currency: z.string().max(8).optional(), features: z.array(z.string().max(120)).max(12).optional(), active: z.boolean().optional(), entitlements: z.any().optional(), quotas: z.number().int().min(0).max(10_000).optional(), description: z.string().max(500).optional() }) }),
  asyncWrap(async (req, res) => {
    const doc = await Plan.findById(req.params.id);
    if (!doc) throw notFound('Plan not found');
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ ok: true, plan: doc });
  })
);

router.patch(
  '/ai-config',
  auditOn('ai-config.update', 'ai'),
  validate({ body: z.object({ guest: z.number().int().min(0).max(1000).optional(), free: z.number().int().min(0).max(2000).optional(), pro: z.number().int().min(0).max(10_000).optional(), admin: z.number().int().min(0).max(50_000).optional(), timezone: z.string().max(64).optional(), maintenanceMode: z.boolean().optional() }) }),
  asyncWrap(async (req, res) => {
    let cfg = await PlatformConfig.findOne({ scope: 'ai' });
    if (!cfg) cfg = await PlatformConfig.create({ scope: 'ai' });
    cfg.quotas = cfg.quotas || {};
    if (req.body.guest != null) cfg.quotas.guest = req.body.guest;
    if (req.body.free != null) cfg.quotas.free = req.body.free;
    if (req.body.pro != null) cfg.quotas.pro = req.body.pro;
    if (req.body.admin != null) cfg.quotas.admin = req.body.admin;
    if (req.body.timezone) cfg.timezone = req.body.timezone;
    if (req.body.maintenanceMode != null) cfg.maintenanceMode = req.body.maintenanceMode;
    cfg.updatedAt = new Date();
    cfg.markModified('quotas');
    await cfg.save();
    res.json({ ok: true, config: cfg });
  })
);

/* ── analytics & audit ─────────────────────────────────────── */
router.get(
  '/analytics',
  asyncWrap(async (_req, res) => {
    const [byTrack, attempts, ai, lessonsByDay] = await Promise.all([
      LessonProgress.aggregate([
        { $lookup: { from: 'lessons', localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
        { $unwind: '$lesson' },
        { $group: { _id: '$lesson.trackId', completed: { $sum: { $cond: ['$completed', 1, 0] } }, visits: { $sum: 1 } } },
        { $lookup: { from: 'tracks', localField: '_id', foreignField: '_id', as: 'track' } },
        { $project: { title: '$track.title', completed: 1, visits: 1 } },
      ]),
      ChallengeAttempt.aggregate([
        { $group: { _id: '$challengeId', attempts: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
        { $lookup: { from: 'challenges', localField: '_id', foreignField: '_id', as: 'c' } },
        { $project: { title: '$c.title', attempts: 1, passed: 1 } },
        { $sort: { attempts: -1 } },
        { $limit: 15 },
      ]),
      AIUsage.aggregate([
        { $group: { _id: { $substr: ['$day', 0, 10] }, requests: { $sum: '$requests' } } },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      LessonProgress.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastVisitedAt' } }, visits: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 },
        { $project: { day: '$_id', visits: 1, _id: 0 } },
      ]),
    ]);
    res.json({ ok: true, analytics: { byTrack, challengeAttempts: attempts, aiUsage: ai, learningActivity: lessonsByDay } });
  })
);

router.get(
  '/audit-logs',
  asyncWrap(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { limit: 50 });
    const filter = {};
    if (req.query.action) filter.action = new RegExp(String(req.query.action).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort('-at').skip(skip).limit(limit).populate('actorId', 'name email').select('-metadata').lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json(paginatedRes(items, total, { page, limit }));
  })
);

export default router;
