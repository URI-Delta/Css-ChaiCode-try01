import { env } from '../config/env.js';
import { log } from '../config/logger.js';
import { AppError } from '../config/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
}

export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusMessage || 500;
  if (err.name === 'ValidationError' && typeof status !== 'number') status = 400;
  status = typeof status === 'number' ? status : 500;
  const code = err.code || (status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR');

  if (status >= 500) {
    log.error('Unhandled error', {
      method: req.method,
      path: req.originalUrl,
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === 'production' ? undefined : err.stack,
      userId: req.user?.id,
    });
  }

  const body = { ok: false, error: { code, message: err.isOperational || err.expose || status < 500 ? err.message : 'Something went wrong on our side' } };
  if (err.details) body.error.details = err.details;
  if (err.retryAfterSec) res.set({ 'Retry-After': String(err.retryAfterSec) });
  if (status === 429 && !err.retryAfterSec) res.set({ 'Retry-After': '60' });

  res.status(status).json(body);
}
