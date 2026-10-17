import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { Track } from '../models/track.model.js';
import { Lesson } from '../models/lesson.model.js';
import { notFound } from '../config/errors.js';
import * as progressSvc from '../services/progress.service.js';
import { getPlans } from '../services/plan.service.js';

const router = Router();

const rank = { free: 0, pro: 1 };
function canAccess(user, content) {
  return (rank[user?.plan?.toLowerCase()] ?? 0) >= (rank[content.accessLevel || 'free'] ?? 0);
}
function userRank(user) {
  return rank[user?.plan] ?? 0;
}

/* tracks */
router.get(
  '/tracks',
  asyncWrap(async (_req, res) => {
    const [tracks, plans] = await Promise.all([
      Track.find({ published: true }).sort('order').lean(),
      getPlans(),
    ]);
    res.json({ ok: true, tracks: tracks.map(strip) });
  })
);

function strip(t) {
  return { id: t._id, title: t.title, slug: t.slug, description: t.description, emoji: t.emoji, accent: t.accent, order: t.order, accessLevel: t.accessLevel, estimatedMinutes: t.estimatedMinutes, lessonsCount: t.lessonsCount };
}

router.get(
  '/tracks/:slug',
  asyncWrap(async (req, res) => {
    const track = await Track.findOne({ slug: req.params.slug, published: true }).lean();
    if (!track) throw notFound('Track not found');
    const lessons = await Lesson.find({ trackId: track._id, status: 'published' }).sort('order').lean();
    res.json({
      ok: true,
      track: strip(track),
      lessons: lessons.map((l) => ({
        id: l._id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        order: l.order,
        difficulty: l.difficulty,
        accessLevel: l.accessLevel,
        estimatedMinutes: l.estimatedMinutes,
        visualizer: l.visualizer,
      })),
    });
  })
);

/* lessons */
router.get(
  '/lessons',
  asyncWrap(async (req, res) => {
    const filter = { status: 'published' };
    if (req.query.track) {
      const track = await Track.findOne({ slug: req.query.track }).lean();
      if (!track) throw notFound('Track not found');
      filter.trackId = track._id;
    }
    const lessons = await Lesson.find(filter).sort('trackId order').select('title slug description trackId order difficulty accessLevel estimatedMinutes visualizer').lean();
    const tracks = await Track.find({ published: true }).sort('order').lean();
    res.json({ ok: true, lessons, tracks: tracks.map(strip) });
  })
);

router.get(
  '/lessons/:slug',
  asyncWrap(async (req, res) => {
    const lesson = await Lesson.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!lesson) throw notFound('Lesson not found');
    const track = await Track.findById(lesson.trackId).lean();
    const siblings = await Lesson.find({ trackId: lesson.trackId, status: 'published' }).sort('order').select('slug title order accessLevel').lean();
    const idx = siblings.findIndex((s) => String(s._id) === String(lesson._id));
    res.json({
      ok: true,
      lesson: {
        id: lesson._id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        objectives: lesson.objectives || [],
        difficulty: lesson.difficulty,
        accessLevel: lesson.accessLevel,
        estimatedMinutes: lesson.estimatedMinutes,
        content: lesson.content,
        codeExamples: lesson.codeExamples || [],
        quiz: (lesson.quiz || []).map((q) => ({ id: q._id, question: q.question, options: q.options, explanation: q.explanation })), // correctIndex NOT exposed pre-submit
        visualizer: lesson.visualizer,
        visualizerConfig: lesson.visualizerConfig,
      },
      track: track && { title: track.title, slug: track.slug },
      prev: idx > 0 ? { slug: siblings[idx - 1].slug, title: siblings[idx - 1].title } : null,
      next: idx < siblings.length - 1 ? { slug: siblings[idx + 1].slug, title: siblings[idx + 1].title } : null,
    });
  })
);

/* lesson progress */
router.put(
  '/lessons/:id/progress',
  authenticate,
  validate({ body: z.object({ completed: z.boolean().optional(), score: z.number().min(0).max(100).optional() }) }),
  asyncWrap(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) throw notFound('Lesson not found');
    const doc = await progressSvc.upsertProgress(req.user.id, lesson._id, req.body);
    const newly = await progressSvc.checkAchievements(req.user.id);
    res.json({ ok: true, progress: doc, newAchievements: newly.map((a) => ({ title: a.title, description: a.description, icon: a.icon })) });
  })
);

/** Quiz submit: client posts chosen indices; server grades against correctIndex. */
router.post(
  '/lessons/:id/quiz',
  authenticate,
  validate({ body: z.object({ answers: z.array(z.number().int().min(-1).max(10)).max(20) }) }),
  asyncWrap(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) throw notFound('Lesson not found');
    const quiz = lesson.quiz || [];
    const answers = req.body.answers || [];
    const results = quiz.map((q, i) => ({ correct: answers[i] === q.correctIndex, explanation: q.explanation, correctIndex: q.correctIndex }));
    const score = quiz.length ? Math.round((results.filter((r) => r.correct).length / quiz.length) * 100) : 100;
    await progressSvc.upsertProgress(req.user.id, lesson._id, { score, completed: true });
    res.json({ ok: true, score, results });
  })
);

/* public leaderboard — aggregate of real progress records */
router.get(
  '/leaderboard',
  asyncWrap(async (_req, res) => {
    const LessonProgress = (await import('../models/lesson-progress.model.js')).LessonProgress;
    const rows = await LessonProgress.aggregate([
      { $match: { completed: true } },
      { $group: { _id: '$userId', lessons: { $sum: 1 } } },
      { $sort: { lessons: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.status': 'active' } },
      {
        $project: {
          userId: '$_id',
          name: {
            $cond: [
              { $gt: [{ $size: { $split: ['$user.name', ' '] } }, 1] },
              { $concat: [{ $arrayElemAt: [{ $split: ['$user.name', ' '] }, 0] }, ' ', { $substr: [{ $arrayElemAt: [{ $split: ['$user.name', ' '] }, 1] }, 0, 1] }, '.'] },
              '$user.name',
            ],
          },
          lessons: 1,
        },
      },
    ]);
    res.json({ ok: true, rows: rows.filter((r) => r.name) });
  })
);

/* my progress */
router.get(
  '/progress/me',
  authenticate,
  asyncWrap(async (req, res) => {
    const stats = await progressSvc.getDashboardStats(req.user.id);
    res.json({ ok: true, stats, subscription: req.user.plan });
  })
);

router.get(
  '/achievements/me',
  authenticate,
  asyncWrap(async (req, res) => {
    const achievements = await progressSvc.achievementsFor(req.user.id);
    res.json({ ok: true, achievements });
  })
);

export default router;
