import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/session.model.js';
import { sha256, randomToken } from '../utils/crypto.js';
import { unauthorized } from '../config/errors.js';

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export function issueAccessToken(userId) {
  return jwt.sign({ sub: String(userId), type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL_SEC,
  });
}

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_TTL_SEC * 1000);
}

/** Creates a session + refresh token. Returns the raw token (goes in a cookie only). */
export async function createSession(userId, device) {
  const raw = randomToken(48);
  const session = await Session.create({
    userId,
    tokenHash: sha256(raw),
    expiresAt: refreshExpiry(),
    device: { userAgent: device?.userAgent?.slice(0, 300), ip: device?.ip },
  });
  return { raw, session };
}

/** Validates + rotates a refresh token in one step. Old token is revoked and marked replaced. */
export async function rotateSession(rawToken, device) {
  if (!rawToken) throw unauthorized('Missing refresh token');
  const tokenHash = sha256(rawToken);
  const session = await Session.findOne({ tokenHash });
  if (!session || session.revoked || session.expiresAt < new Date()) {
    throw unauthorized('Session expired. Sign in again.');
  }
  // Reuse detection: a rotated-then-reused token implies leakage → revoke the whole session line.
  if (session.replacedByHash) {
    await Session.updateOne({ _id: session._id }, { revoked: true });
    throw unauthorized('Session reuse detected. Sign in again.');
  }

  const nextRaw = randomToken(48);
  const nextHash = sha256(nextRaw);
  session.revoked = true;
  session.revokedAt = new Date();
  session.replacedByHash = nextHash;
  await session.save();

  const next = await Session.create({
    userId: session.userId,
    tokenHash: nextHash,
    expiresAt: refreshExpiry(),
    device: {
      userAgent: device?.userAgent?.slice(0, 300),
      ip: device?.ip || session.device?.ip,
    },
  });
  return { raw: nextRaw, session: next, userId: session.userId };
}

export async function revokeSessionByToken(rawToken) {
  if (!rawToken) return;
  await Session.updateOne({ tokenHash: sha256(rawToken), revoked: false }, { revoked: true, revokedAt: new Date() });
}

export async function revokeAllUserSessions(userId) {
  await Session.updateMany({ userId, revoked: false }, { revoked: true, revokedAt: new Date() });
}

export async function listSessions(userId) {
  return Session.find({ userId, revoked: false, expiresAt: { $gt: new Date() } })
    .select('device createdAt lastUsed expiresAt')
    .sort({ createdAt: -1 })
    .lean();
}
