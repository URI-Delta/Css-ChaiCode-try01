import { badRequest } from '../config/errors.js';

/** Usage: validate({ body: LoginSchema, params: ..., query: ... }) */
export function validate(schemas) {
  return (req, _res, next) => {
    const errors = [];
    for (const part of ['body', 'params', 'query']) {
      const schema = schemas?.[part];
      if (!schema) continue;
      const parsed = schema.safeParse(req[part]);
      if (parsed.success) {
        req[part] = parsed.data;
      } else {
        for (const issue of parsed.error.issues) {
          errors.push({
            field: `${part}${issue.path.length ? `.${issue.path.join('.')}` : ''}`,
            message: issue.message,
          });
        }
      }
    }
    if (errors.length) {
      next(badRequest('Validation failed', errors));
      return;
    }
    next();
  };
}

/** Strips mongo operators and any key whose name starts with $ or contains . from user JSON bodies. */
export function sanitizeJson(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = deepClean(req.body);
  next();
}

function deepClean(value, depth = 0) {
  if (depth > 6 || value === null || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 100_000) : value;
  if (Array.isArray(value)) return value.map((v) => deepClean(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith('$') || k.includes('.') || k === '__proto__') continue;
    out[k] = deepClean(v, depth + 1);
  }
  return out;
}
