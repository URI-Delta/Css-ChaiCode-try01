import mongoose from 'mongoose';
import { CHALLENGE_TYPES } from '../config/constants.js';

const ruleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // stable rule id used in feedback
    label: { type: String, required: true }, // human-readable requirement e.g. "Uses justify-content"
    /** declarative checks run against serialized visual state; css-ast checks against user CSS text */
    check: {
      engine: { type: String, enum: ['declarative', 'css-ast', 'answer'], required: true },
      // css-ast: { selector?, property, values?, op: 'has'|'equals'|'matches' }
      // declarative: what the sandbox harness reports (flex/grid layout facts)
      property: String,
      selector: String,
      values: [String],
      op: { type: String, enum: ['has', 'equals', 'matches', 'any-of'] },
      value: String,
    },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    type: { type: String, enum: Object.values(CHALLENGE_TYPES), required: true, index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    accessLevel: { type: String, enum: ['free', 'pro'], default: 'free' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    estimatedMinutes: { type: Number, default: 15 },
    trackTag: String,
    instructions: { type: String, default: '' }, // markdown
    starter: { type: mongoose.Schema.Types.Mixed, default: {} }, // { html, css, js } or { question, options, correctIndex }
    /** Representation of the target for visual challenges (safe, public). */
    target: {
      css: { type: String, default: '' },
      notes: String,
    },
    validation: { rules: [ruleSchema], config: mongoose.Schema.Types.Mixed },
    hints: [String],
    solution: String, // revealed only after N failed attempts
    solutionLockedUntilAttempts: { type: Number, default: 3 },
    points: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const Challenge = mongoose.model('Challenge', schema);
