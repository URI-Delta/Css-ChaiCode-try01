import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rate-limit.js';
import * as ai from '../services/ai.service.js';
import { badRequest } from '../config/errors.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().max(64).optional(),
  lessonSlug: z.string().max(160).optional(),
  guestSessionId: z.string().max(80).optional(),
});

router.use([
  function ensureAiScope(req, _res, next) {
    req.userKey = null;
    next();
  },
]);

router.post(
  '/chat',
  aiLimiter,
  validate({ body: chatSchema }),
  asyncWrap(async (req, res) => {
    const status = ai.aiStatus();
    if (!status.configured) {
      return res.status(503).json({
        ok: false,
        error: { code: 'AI_NOT_CONFIGURED', message: 'The AI tutor is not configured on this deployment. Add AI_PROVIDER and AI_API_KEY to enable it.' },
      });
    }
    const user = req.user || null;
    // resolve identity first so quota keys are stable, then reserve BEFORE provider call
    const userKey = ai.userKeyFor(user, req.body.guestSessionId, req.ip);
    const { quota, used } = await ai.reserveAiQuota(userKey, user);
    const result = await ai.chat({ user, userKey, conversationId: req.body.conversationId, lessonSlug: req.body.lessonSlug, message: req.body.message });
    const convo = result.conversation.toObject ? result.conversation.toObject() : result.conversation;
    res.json({
      ok: true,
      reply: result.reply,
      conversationId: convo._id ?? result.conversation._id,
      usage: { used, quota },
    });
  })
);

router.get(
  '/usage',
  asyncWrap(async (req, res) => {
    const userKey = ai.userKeyFor(req.user || null, req.query.guestSessionId, req.ip);
    const info = await ai.usageFor(userKey, req.user || null);
    res.json({ ok: true, ...info, ...ai.aiStatus() });
  })
);

router.get(
  '/conversations',
  authenticate,
  asyncWrap(async (req, res) => {
    const key = ai.userKeyFor(req.user, undefined, req.ip);
    const conversations = await ai.listConversations(req.user, key);
    res.json({ ok: true, conversations });
  })
);

router.get(
  '/conversations/:id',
  authenticate,
  asyncWrap(async (req, res) => {
    const key = ai.userKeyFor(req.user, undefined, req.ip);
    const conv = await ai.getConversation(req.params.id, req.user, key);
    if (!conv) throw badRequest('Conversation not found');
    res.json({ ok: true, conversation: conv });
  })
);

export default router;
