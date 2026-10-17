import { AuditLog } from '../models/audit-log.model.js';
import { log } from '../config/logger.js';

/** Record an audit event. Never persist passwords/tokens — callers must pass safe metadata only. */
export async function audit(actor, action, targetType, targetId, metadata) {
  try {
    await AuditLog.create({
      actorId: actor?.id || actor?._id,
      actorEmail: actor?.email,
      action,
      targetType,
      targetId: targetId?.toString?.() ?? String(targetId ?? ''),
      metadata,
      ip: actor?.ip,
    });
  } catch (err) {
    log.warn('Audit write failed', { action, message: err.message });
  }
}

/** Wraps a controller so a success triggers an audit entry. */
export function auditOn(action, targetType, metaFn) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        let target = req.params?.id;
        let meta = {};
        try {
          const r = metaFn ? metaFn(req, body) : {};
          target = r.targetId ?? target;
          meta = r.metadata ?? {};
        } catch { /* keep defaults */ }
        audit(req.user, action, targetType, target, meta).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
