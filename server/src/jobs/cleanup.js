import { Session } from '../models/session.model.js';
import { Conversation } from '../models/conversation.model.js';
import { log } from '../config/logger.js';

export async function runCleanup() {
  try {
    const sessions = await Session.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { revoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 86400 * 1000) } }],
    });
    const convs = await Conversation.deleteMany({ expiresAt: { $lt: new Date() } });
    log.info('cleanup', { expiredSessions: sessions.deletedCount, expiredConversations: convs.deletedCount });
  } catch (err) {
    log.warn('Cleanup job failed', { message: err.message });
  }
}
