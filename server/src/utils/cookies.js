import { env, isProd } from '../config/env.js';

const names = {
  access: 'accessToken',
  refresh: 'refreshToken',
};

const baseOpts = {
  httpOnly: true,
  secure: isProd, // dev over http://localhost must still work
  sameSite: 'lax',
  path: '/',
  signed: false,
};

export function setAccessCookie(res, token) {
  res.cookie(names.access, token, {
    ...baseOpts,
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshCookie(res, token, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  res.cookie(names.refresh, token, {
    ...baseOpts,
    maxAge: maxAgeMs,
    // cross-origin API (client on :5173, server on :4000) in dev needs SameSite=Lax + path scoping
    sameSite: isProd ? 'strict' : 'lax',
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(names.access, baseOpts);
  res.clearCookie(names.refresh, { ...baseOpts, sameSite: isProd ? 'strict' : 'lax' });
}

export const COOKIE_NAMES = names;
