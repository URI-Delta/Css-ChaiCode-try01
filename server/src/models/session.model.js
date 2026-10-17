import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // sha256 of the refresh token
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false, index: true },
    revokedAt: Date,
    replacedByHash: String,
    device: {
      userAgent: String,
      ip: String,
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', schema);
