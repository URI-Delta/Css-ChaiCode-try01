import mongoose from 'mongoose';

const filesSchema = new mongoose.Schema(
  {
    html: { type: String, default: '' },
    css: { type: String, default: '' },
    js: { type: String, default: '' },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '🧩' },
    objectives: [String],
    requirements: [String], // checklist items
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate', index: true },
    accessLevel: { type: String, enum: ['free', 'pro'], default: 'free' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    starterFiles: filesSchema,
    hints: [String],
    solution: filesSchema,
    estimatedMinutes: { type: Number, default: 45 },
    order: { type: Number, default: 0, index: true },
    /** Declarative completion criteria checked client-side against the user's CSS */
    completionCriteria: [
      {
        label: String,
        property: String,
        selector: String,
        values: [String],
        op: { type: String, enum: ['has', 'equals', 'matches', 'any-of'] },
        value: String,
      },
    ],
  },
  { timestamps: true }
);

export const ProjectTemplate = mongoose.model('ProjectTemplate', schema);
