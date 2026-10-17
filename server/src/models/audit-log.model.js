import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: String,
    action: { type: String, required: true, index: true }, // e.g. 'user.suspend', 'lesson.publish'
    targetType: { type: String, enum: ['user', 'lesson', 'track', 'challenge', 'project', 'plan', 'config', 'subscription', 'ai'], required: true },
    targetId: String,
    metadata: { type: mongoose.Schema.Types.Mixed, select: false }, // selected explicitly by the admin audit endpoint
    ip: String,
    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

schema.query.selectAuditFields = function selectAuditFields() {
  return this.select('-metadata');
};

export const AuditLog = mongoose.model('AuditLog', schema);
