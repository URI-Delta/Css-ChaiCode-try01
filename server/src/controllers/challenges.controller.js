import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { challengeLimiter } from '../middleware/rate-limit.js';
import { Challenge } from '../models/challenge.model.js';
import { ChallengeAttempt } from '../models/challenge-attempt.model.js';
import { notFound, badRequest } from '../config/errors.js';
import { gradeSubmission } from '../services/grader.service.js';
import * as progressSvc from '../services/progress.service.js';
import { getSubscriptionFor } from '../services/billing.service.js';

const router = Router();

const rank = { free: 0, pro: 1 };
function canAccess(user, content) {
  return (rank[user?.plan] ?? 0) >= (rank[content.accessLevel || 'free'] ?? 0);
}

/** Attempt-count based solution unlocking, per user+challenge. */
async function attemptCountFor(userId, challengeId) {
  return ChallengeAttempt.countDocuments({ userId, challengeId });
}

router.get(
  '/',
  asyncWrap(async (req, res) => {
    const filter = { status: 'published' };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const list = await Challenge.find(filter).sort('difficulty').lean();
    const publicList = [];
    for (const c of list) {
      publicList.push({
        id: c._id,
        title: c.title,
        slug: c.slug,
        type: c.type,
        difficulty: c.difficulty,
        accessLevel: c.accessLevel,
        points: c.points,
        estimatedMinutes: c.estimatedMinutes,
        trackTag: c.trackTag,
        description: c.description,
      });
    }
    res.json({ ok: true, challenges: publicList });
  })
);

router.get(
  '/:slug',
  asyncWrap(async (req, res) => {
    const c = await Challenge.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!c) throw notFound('Challenge not found');
    const isPro = c.accessLevel === 'pro';
    res.json({
      ok: true,
      challenge: {
        id: c._id,
        title: c.title,
        slug: c.slug,
        type: c.type,
        difficulty: c.difficulty,
        accessLevel: c.accessLevel,
        points: c.points,
        estimatedMinutes: c.estimatedMinutes,
        instructions: c.instructions,
        starter: c.starter,
        hints: c.hints || [],
        hasSolution: Boolean(c.solution),
      },
      locked: isPro && !canAccess(req.user, c) ? { upgradeRequired: true } : undefined,
    });
  })
);

const submitSchema = z.object({
  answer: z.union([z.string().max(500), z.number()]).optional(),
  html: z.string().max(200_000).optional(),
  css: z.string().max(200_000).optional(),
  js: z.string().max(200_000).optional(),
  /** sandbox-computed layout/computed-style facts (supplementary evidence) */
  facts: z.record(z.string(), z.any()).optional(),
  hintIndex: z.number().int().min(0).max(10).optional(),
});

router.get(
  '/:id/attempts/me',
  authenticate,
  asyncWrap(async (req, res) => {
    const attempts = await ChallengeAttempt.find({ userId: req.user.id, challengeId: req.params.id })
      .sort({ attemptedAt: -1 })
      .limit(20)
      .lean();
    res.json({
      ok: true,
      attempts: attempts.map((a) => ({ id: a._id, passed: a.passed, score: a.score, results: a.result, attemptedAt: a.attemptedAt })),
      bestPassed: attempts.some((a) => a.passed),
    });
  })
);

router.post(
  '/:id/attempts',
  authenticate,
  challengeLimiter,
  validate({ body: submitSchema }),
  asyncWrap(async (req, res) => {
    const c = await Challenge.findById(req.params.id).lean();
    if (!c) throw notFound('Challenge not found');
    if (!canAccess(req.user, c)) return res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'This challenge requires Pro', details: { upgradeRequired: true } } });

    // hints: return the requested hint only, never the solution
    const hintIndex = req.body?.hintIndex;
    if (hintIndex != null && !req.body?.answer && !req.body?.css) {
      const hint = (c.hints || [])[hintIndex];
      if (hint == null) throw badRequest('No hint at that level');
      return res.json({ ok: true, hint });
    }

    const submission = {
      html: req.body.html,
      js: req.body.js,
      css: req.body.css,
      answer: req.body.answer,
      facts: req.body.facts,
    };
    const graded = gradeSubmission(c, submission);

    await ChallengeAttempt.create({
      userId: req.user.id,
      challengeId: c._id,
      passed: graded.passed,
      score: graded.score,
      result: graded.results,
      submission: {
        kind: c.type,
        sizeBytes: JSON.stringify(submission).length,
        answer: submission.answer != null ? String(submission.answer).slice(0, 200) : undefined,
      },
    });

    let newAchievements = [];
    if (graded.passed) {
      newAchievements = (await progressSvc.checkAchievements(req.user.id)).map((a) => ({ title: a.title, description: a.description, icon: a.icon }));
    }

    const attemptsSoFar = await attemptCountFor(req.user.id, c._id);
    const showSolution = !graded.passed && c.solution != null && attemptsSoFar >= (c.solutionLockedUntilAttempts ?? 3);

    res.status(graded.passed ? 200 : 422).json({
      ok: graded.passed,
      passed: graded.passed,
      score: graded.score,
      results: graded.results,
      attempts: attemptsSoFar,
      ...(showSolution ? { solution: c.solution } : {}),
      ...(graded.passed ? { newAchievements } : {}),
    });
  })
);

export default router;
