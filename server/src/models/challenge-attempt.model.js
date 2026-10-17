import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    passed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    /** Per-rule feedback: [{ id, label, passed }] */
    result: [
      {
        id: String,
        label: String,
        passed: Boolean,
      },
    ],
    /** Safe summary of the submission — never raw code blobs bigger than needed. */
    submission: {
      kind: String,
      sizeBytes: Number,
      answer: String, // truncated user answer for MCQ/blank types
    },
    attemptedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, challengeId: 1, attemptedAt: -1 });

export const ChallengeAttempt = mongoose.model('ChallengeAttempt', schema);
