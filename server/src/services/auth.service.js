import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { env, isProd, emailConfigured } from '../config/env.js';
import { badRequest, conflict, unauthorized } from '../config/errors.js';
import { createTokenPair } from '../utils/crypto.js';
import { verificationEmail, passwordResetEmail, sendEmail } from './email.service.js';
import { Notification } from '../models/notification.model.js';
import { PLANS } from '../config/constants.js';

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email }).lean();
  if (existing) throw conflict('An account with that email already exists');

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'user',
    plan: PLANS.FREE, // server-decided; the client never picks this
  });

  let verifyToken = null;
  if (emailConfigured || !isProd) {
    const { raw, hash } = createTokenPair();
    await User.updateOne({ _id: user._id }, { emailVerifyTokenHash: hash, emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000) });
    verifyToken = raw;
    const baseUrl = isProd ? env.CLIENT_URL : 'http://localhost:5173';
    const url = `${baseUrl}/verify-email?token=${raw}`;
    const mail = verificationEmail(url);
    const res = await sendEmail({ to: email, ...mail });
    if (!res.delivered && isProd) {
      // keep the token hash, but tell the ops log — user can request a resend
      // eslint-disable-next-line no-console
    }
  }
  return { user, verifyToken };
}

export async function findByEmail(email) {
  return User.findOne({ email }).select('+passwordHash').exec();
}

const loginAttempts = new Map(); // email → { count, until }
export function throttleLogin(email) {
  const key = email.toLowerCase();
  const rec = loginAttempts.get(key);
  if (rec && rec.until > Date.now()) {
    const waitSec = Math.ceil((rec.until - Date.now()) / 1000);
    throw unauthorized(`Account temporarily locked after repeated failures. Try again in ${waitSec}s.`);
  }
}
export function recordFailedLogin(email) {
  const key = email.toLowerCase();
  const rec = loginAttempts.get(key) || { count: 0, until: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.until = Date.now() + 10 * 60 * 1000;
    rec.count = 0;
  }
  loginAttempts.set(key, rec);
}
export function clearFailedLogins(email) {
  loginAttempts.delete(email.toLowerCase());
}

export async function notifyUser(userId, { type = 'info', title, message }) {
  await Notification.create({ userId, type, title, message });
}

export async function setVerified(user) {
  user.emailVerified = true;
  user.emailVerifyTokenHash = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
}

/** Reissues a fresh verification token and emails it. Returns { raw } or { raw: null } when SMTP is off in prod. */
export async function regenerateVerifyToken(user) {
  const { raw, hash } = createTokenPair();
  user.emailVerifyTokenHash = hash;
  user.emailVerifyExpires = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  const baseUrl = isProd ? env.CLIENT_URL : 'http://localhost:5173';
  const url = `${baseUrl}/verify-email?token=${raw}`;
  await sendEmail({ to: user.email, ...verificationEmail(url) });
  return { raw: emailConfigured || !isProd ? raw : null };
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email }).select('+passwordResetTokenHash').exec();
  if (!user) {
    // Respond identically to avoid account enumeration
    return { sent: true, user: null, resetToken: null };
  }
  const { raw, hash } = createTokenPair(); // random, hashed in storage
  user.passwordResetTokenHash = hash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour, single use
  await user.save();
  const baseUrl = isProd ? env.CLIENT_URL : 'http://localhost:5173';
  const url = `${baseUrl}/reset-password/${raw}`;
  await sendEmail({ to: email, ...passwordResetEmail(url) });
  return { sent: true, user, resetToken: emailConfigured || !isProd ? raw : null };
}

export async function resetPassword({ token, password }) {
  const { sha256 } = await import('../utils/crypto.js');
  const user = await User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpires: { $gt: new Date() },
  }).exec();
  if (!user) throw badRequest('This reset link is invalid or has expired');

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined; // single-use
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();
  return user;
}

export async function consumeEmailVerifyToken(token) {
  const { sha256 } = await import('../utils/crypto.js');
  const user = await User.findOne({
    emailVerifyTokenHash: sha256(token),
    emailVerifyExpires: { $gt: new Date() },
  }).exec();
  if (!user) throw badRequest('This verification link is invalid or has expired');
  await setVerified(user);
  return user;
}

export function profileOf(userDoc) {
  return {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    plan: userDoc.plan,
    emailVerified: userDoc.emailVerified,
    avatar: userDoc.avatar ?? null,
    bio: userDoc.bio ?? '',
    preferences: userDoc.preferences ?? {},
    createdAt: userDoc.createdAt,
  };
}
