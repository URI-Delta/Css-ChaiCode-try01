import { Router } from 'express';
import { z } from 'zod';
import { asyncWrap } from '../utils/async.utils.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import * as auth from '../services/auth.service.js';
import * as tokens from '../services/token.service.js';
import { setAccessCookie, setRefreshCookie, clearAuthCookies, COOKIE_NAMES } from '../utils/cookies.js';
import { unauthorized } from '../config/errors.js';
import { emailConfigured } from '../config/env.js';
import { regenerateVerifyToken } from '../services/auth.service.js';
import { issueAccessToken } from '../services/token.service.js';
import { User } from '../models/user.model.js';

const router = Router();

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .max(200);

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  password: passwordRule,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const deviceOf = (req) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

function issueSession(res, user, device) {
  return tokens.createSession(user._id, device).then(({ raw }) => {
    setAccessCookie(res, issueAccessToken(user._id));
    setRefreshCookie(res, raw);
  });
}

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncWrap(async (req, res) => {
    const { user, verifyToken } = await auth.registerUser(req.body);
    await issueSession(res, user, deviceOf(req));
    await auth.notifyUser(user._id, { type: 'system', title: 'Welcome to CSS Visual', message: 'Complete your first lesson to start your streak.' });
    res.status(201).json({
      ok: true,
      user: auth.profileOf(user),
      // only surfaced when email is not configured so devs/testing can still verify
      ...(verifyToken && !emailConfigured ? { devVerifyToken: verifyToken } : {}),
    });
  })
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncWrap(async (req, res) => {
    const { email, password } = req.body;
    auth.throttleLogin(email);
    const user = await auth.findByEmail(email);
    const valid = user && (await user.comparePassword(password));
    if (!valid) {
      auth.recordFailedLogin(email);
      throw unauthorized('Invalid email or password');
    }
    if (user.status === 'suspended') throw unauthorized('This account is suspended. Contact support.');
    auth.clearFailedLogins(email);
    user.lastLoginAt = new Date();
    await user.save();
    await issueSession(res, user, deviceOf(req));
    res.json({ ok: true, user: auth.profileOf(user) });
  })
);

router.post(
  '/refresh',
  asyncWrap(async (req, res) => {
    const raw = req.cookies?.[COOKIE_NAMES.refresh];
    const { raw: nextRaw, userId } = await tokens.rotateSession(raw, deviceOf(req));
    const User = (await import('../models/user.model.js')).User;
    const userDoc = await User.findById(userId).lean();
    if (!userDoc) throw unauthorized('Account no longer exists');
    setAccessCookie(res, issueAccessToken(userDoc._id));
    setRefreshCookie(res, nextRaw);
    res.json({ ok: true, user: auth.profileOf(userDoc) });
  })
);

router.post(
  '/logout',
  asyncWrap(async (req, res) => {
    await tokens.revokeSessionByToken(req.cookies?.[COOKIE_NAMES.refresh]);
    clearAuthCookies(res);
    res.json({ ok: true });
  })
);

router.get(
  '/me',
  authenticate,
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw unauthorized('Account no longer exists');
    res.json({ ok: true, user: auth.profileOf(user) });
  })
);

const emailOnly = z.object({ email: z.string().email() });

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: emailOnly }),
  asyncWrap(async (req, res) => {
    const { resetToken } = await auth.requestPasswordReset(req.body.email);
    // identical response whether or not the account exists (no enumeration)
    res.json({
      ok: true,
      message: 'If that email is registered, a reset link is on its way.',
      // surfaced only when SMTP is unconfigured so flows remain testable
      ...(resetToken && !emailConfigured ? { devResetToken: resetToken, devResetNote: 'SMTP not configured — use this token in dev only' } : {}),
    });
  })
);

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordRule,
});

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetSchema }),
  asyncWrap(async (req, res) => {
    await auth.resetPassword(req.body);
    res.json({ ok: true, message: 'Password updated. You can sign in now.' });
  })
);

const verifySchema = z.object({ token: z.string().min(10).max(300) });

router.post(
  '/verify-email',
  validate({ body: verifySchema }),
  asyncWrap(async (req, res) => {
    const user = await auth.consumeEmailVerifyToken(req.body.token);
    res.json({ ok: true, user: auth.profileOf(user) });
  })
);

router.post(
  '/verify-email/resend',
  authLimiter,
  authenticate,
  asyncWrap(async (req, res) => {
    const user = await User.findById(req.user.id).exec();
    if (!user || user.emailVerified) return res.json({ ok: true, message: 'Email is already verified' });
    const { raw } = await regenerateVerifyToken(user);
    res.json({ ok: true, message: raw || 'If SMTP is configured, a new link was sent.' });
  })
);

export default router;
