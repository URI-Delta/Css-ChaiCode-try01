import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = mongoose.model('UserAchievement', schema);
