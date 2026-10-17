import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🏆' },
    /** Declarative criteria evaluated against user stats; consumers: { lessons, challengesPassed, projects, streak, aiRequests } */
    criteria: {
      type: {
        lessons: { type: Number, default: 0 },
        challengesPassed: { type: Number, default: 0 },
        projects: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        aiRequests: { type: Number, default: 0 },
      },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model('Achievement', schema);
