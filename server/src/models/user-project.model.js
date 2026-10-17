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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'Untitled project' },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectTemplate' },
    templateSlug: String,
    forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProject' },
    files: filesSchema,
    visibility: { type: String, enum: ['private', 'shared', 'public'], default: 'private', index: true },
    shareSlug: { type: String, unique: true, sparse: true },
    /** Autosave metadata */
    version: { type: Number, default: 1 },
    savedFromPlayground: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ userId: 1, updatedAt: -1 });

export const UserProject = mongoose.model('UserProject', schema);
