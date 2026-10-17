import mongoose from 'mongoose';

const codeExampleSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Example' },
    language: { type: String, enum: ['html', 'css', 'js'], default: 'css' },
    code: { type: String, default: '' },
    note: String,
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    explanation: String,
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
    order: { type: Number, default: 0, index: true },
    description: { type: String, default: '' },
    objectives: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    accessLevel: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedMinutes: { type: Number, default: 15 },
    /** Markdown content body (rendered safely on the client). */
    content: { type: String, default: '' },
    codeExamples: [codeExampleSchema],
    quiz: [quizSchema],
    /** Key of the reusable visualizer shown with this lesson. */
    visualizer: String,
    visualizerConfig: { type: mongoose.Schema.Types.Mixed }, // initial settings for that visualizer
  },
  { timestamps: true }
);

schema.index({ trackId: 1, order: 1 });

export const Lesson = mongoose.model('Lesson', schema);
