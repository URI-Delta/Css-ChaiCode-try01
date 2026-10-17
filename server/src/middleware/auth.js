import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../config/errors.js';
import { ROLES } from '../config/constants.js';

/** Reads the access-token cookie (or Bearer header in test mode) and attaches req.user. */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = req.cookies?.accessToken || (header?.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) throw unauthorized('Sign in to continue');

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      throw unauthorized('Session expired. Sign in again.');
    }

    const user = await User.findById(payload.sub).lean();
    if (!user) throw unauthorized('Account no longer exists');
    if (user.status === 'suspended') throw forbidden('Your account is suspended. Contact support.');
    if (user.passwordChangedAt && payload.iat && new Date(user.passwordChangedAt).getTime() / 1000 > payload.iat) {
      throw unauthorized('Your password changed. Please sign in again.');
    }

    req.user = {
      id: payload.sub,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      emailVerified: user.emailVerified,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    const required = roles.length ? roles : [ROLES.ADMIN];
    if (!required.includes(req.user.role)) {
      return next(forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

/** Requires the given plan or higher (pro ⊇ free). Reads server-side user.plan only. */
export function requirePlan(plan) {
  const rank = { free: 0, pro: 1 };
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if ((rank[req.user.plan] ?? -1) < rank[plan]) {
      return next(forbidden('This content requires a Pro subscription', { upgradeRequired: true }));
    }
    next();
  };
}
