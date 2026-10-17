import { env } from './env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[env.NODE_ENV === 'production' ? 'info' : 'debug'];

const REMOVED = '[REDACTED]';
const sensitiveKeys = /^(password|passwordhash|password|passwordconfirm|newpassword|token|refreshtoken|accesstoken|secret|apikey|ai_api_key|smtp_pass|authorization|cookie|setcookie|webhooksignature|cvv|cardnumber)$/i;

function redact(value, depth = 0) {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = sensitiveKeys.test(k) ? REMOVED : redact(v, depth + 1);
  }
  return out;
}

function emit(level, msg, meta) {
  if (LEVELS[level] < threshold) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...(meta ? { meta: redact(meta) } : {}) };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
};
