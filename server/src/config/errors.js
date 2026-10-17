export class AppError extends Error {
  /** @param {number} status @param {string} code @param {any} [details] */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}
export const badRequest = (message, details) => new AppError(message, 400, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required', details) => new AppError(message, 401, 'UNAUTHORIZED', details);
export const forbidden = (message = 'Not allowed', details) => new AppError(message, 403, 'FORBIDDEN', details);
export const notFound = (message = 'Resource not found') => new AppError(message, 404, 'NOT_FOUND');
export const conflict = (message, details) => new AppError(message, 409, 'CONFLICT', details);
export const rateLimited = (message = 'Too many requests', retryAfterSec) => {
  const err = new AppError(message, 429, 'RATE_LIMITED');
  if (retryAfterSec) err.retryAfterSec = retryAfterSec;
  return err;
};
export const quotaExceeded = (message = 'Daily AI quota exceeded. Upgrade or try again tomorrow.') =>
  new AppError(message, 429, 'AI_QUOTA_EXCEEDED');
