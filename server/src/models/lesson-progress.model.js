import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    completed: { type: Boolean, default: false, index: true },
    completedAt: Date,
    score: { type: Number, min: 0, max: 100 },
    lastVisitedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, lessonId: 1 }, { unique: true });
schema.index({ userId: 1, completed: 1 });

export const LessonProgress = mongoose.model('LessonProgress', schema);
