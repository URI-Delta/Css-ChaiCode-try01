import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/user.model.js';
import { Bookmark } from '../models/bookmark.model.js';
import { Notification } from '../models/notification.model.js';
import * as auth from '../services/auth.service.js';
import * as tokens from '../services/token.service.js';
import { hashPassword } from '../services/auth.service.js';
import { clearAuthCookies } from '../utils/cookies.js';
import { badRequest } from '../config/errors.js';

const router = Router();

router.get(
  '/bookmarks',
  authenticate,
  asyncWrap(async (req, res) => {
    const items = await Bookmark.find({ userId: req.user.id }).sort('-createdAt').limit(200).lean();
    res.json({ ok: true, bookmarks: items });
  })
);

const bookmarkSchema = z.object({
  resourceType: z.enum(['lesson', 'challenge', 'project', 'snippet']),
  resourceId: z.string().min(1).max(160),
  meta: z.object({ title: z.string().max(200).optional(), slug: z.string().max(160).optional() }).optional(),
});

router.post(
  '/bookmarks',
  authenticate,
  validate({ body: bookmarkSchema }),
  asyncWrap(async (req, res) => {
    const doc = await Bookmark.findOneAndUpdate(
      { userId: req.user.id, resourceType: req.body.resourceType, resourceId: req.body.resourceId },
      { $set: { meta: req.body.meta } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, bookmark: doc });
  })
);

router.delete(
  '/bookmarks',
  authenticate,
  validate({ body: bookmarkSchema.pick({ resourceType: true, resourceId: true }) }),
  asyncWrap(async (req, res) => {
    await Bookmark.deleteOne({ userId: req.user.id, resourceType: req.body.resourceType, resourceId: req.body.resourceId });
    res.json({ ok: true });
  })
);

/* profile */
const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().url().max(500).optional().or(z.literal('')),
});

router.patch(
  '/profile',
  authenticate,
  validate({ body: profileSchema }),
  asyncWrap(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: req.body }, { new: true }).lean();
    res.json({ ok: true, user: auth.profileOf(user) });
  })
);

/* preferences */
const prefsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  editorFontSize: z.number().int().min(10).max(24).optional(),
  reducedMotion: z.boolean().optional(),
});

router.patch(
  '/preferences',
  authenticate,
  validate({ body: prefsSchema }),
  asyncWrap(async (req, res) => {
    const setOps = {};
    for (const [k, v] of Object.entries(req.body)) setOps[`preferences.${k}`] = v;
    const user = await User.findByIdAndUpdate(req.user.id, { $set: setOps }, { new: true }).lean();
    res.json({ ok: true, user: auth.profileOf(user) });
  })
);

/* security: change password + sessions */
router.post(
  '/password/change',
  authenticate,
  validate({ body: z.object({ current: z.string().min(1).max(200), next: z.string().min(8).max(200) }) }),
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user.id).select('+passwordHash').exec();
    const ok = await user.comparePassword(req.body.current);
    if (!ok) throw badRequest('Current password is incorrect');
    const strength = z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number');
    const check = strength.safeParse(req.body.next);
    if (!check.success) throw badRequest(check.error.issues[0].message);
    user.passwordHash = await hashPassword(req.body.next);
    user.passwordChangedAt = new Date();
    await user.save();
    await tokens.revokeAllUserSessions(req.user.id); // every session must re-login
    clearAuthCookies(res);
    res.json({ ok: true, message: 'Password changed. Please sign in again.' });
  })
);

router.get(
  '/sessions',
  authenticate,
  asyncWrap(async (req, res) => {
    const sessions = await tokens.listSessions(req.user.id);
    res.json({ ok: true, sessions });
  })
);

router.post(
  '/sessions/revoke-all',
  authenticate,
  asyncWrap(async (req, res) => {
    await tokens.revokeAllUserSessions(req.user.id);
    clearAuthCookies(res);
    res.json({ ok: true });
  })
);

/* notifications */
router.get(
  '/notifications',
  authenticate,
  asyncWrap(async (req, res) => {
    const items = await Notification.find({ userId: req.user.id }).sort('-createdAt').limit(50).lean();
    const unread = await Notification.countDocuments({ userId: req.user.id, readAt: null });
    res.json({ ok: true, notifications: items, unread });
  })
);

router.post(
  '/notifications/read',
  authenticate,
  asyncWrap(async (req, res) => {
    await Notification.updateMany({ userId: req.user.id, readAt: null }, { readAt: new Date() });
    res.json({ ok: true });
  })
);

export default router;
