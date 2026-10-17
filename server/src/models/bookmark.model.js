import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceType: { type: String, enum: ['lesson', 'challenge', 'project', 'snippet'], required: true },
    resourceId: { type: String, required: true }, // id or slug depending on type
    meta: { type: mongoose.Schema.Types.Mixed }, // title snapshot for fast listing
  },
  { timestamps: true }
);

schema.index({ userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', schema);
