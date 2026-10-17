import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info' }, // info | achievement | billing | system
    title: String,
    message: String,
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', schema);
