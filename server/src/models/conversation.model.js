import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    /** Truncation guardrails applied when persisting */
    tokensIn: Number,
    tokensOut: Number,
    truncated: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    guestKey: { type: String, index: true },
    title: { type: String, default: 'New conversation' },
    lessonSlug: String, // lesson context
    messages: {
      type: [messageSchema],
      validate: [(v) => v.length <= 40, 'Conversation messages retained after pruning to 40'],
    },
    lastActiveAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true }, // retention
  },
  { timestamps: true }
);

schema.index({ userId: 1, lastActiveAt: -1 });

export const Conversation = mongoose.model('Conversation', schema);
