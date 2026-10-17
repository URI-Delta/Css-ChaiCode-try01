import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../config/constants.js';

const schema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
    passwordHash: { type: String, select: false, required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, index: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE, index: true },
    avatar: String,
    bio: String,
    preferences: {
      editorFontSize: { type: Number, default: 13 },
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      reducedMotion: { type: Boolean, default: false },
    },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    lastLoginAt: { type: Date, select: false },
    suspendedReason: { type: String, select: false },
  },
  { timestamps: true }
);

schema.methods.comparePassword = function compare(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

schema.index({ role: 1, status: 1 });

export const User = mongoose.model('User', schema);
