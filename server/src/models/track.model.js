import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '📘' },
    accent: { type: String, default: '#ff7a45' },
    order: { type: Number, required: true, index: true },
    accessLevel: { type: String, enum: ['free', 'pro'], default: 'free' },
    published: { type: Boolean, default: false, index: true },
    estimatedMinutes: { type: Number, default: 60 },
    lessonsCount: { type: Number, default: 0 }, // denormalized for cards
  },
  { timestamps: true }
);

export const Track = mongoose.model('Track', schema);
