import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    scope: { type: String, default: 'ai' }, // bucket key: 'ai' | 'platform'
    /** Resolved daily quotas; admin-editable, seeded from env at boot when absent. */
    quotas: {
      guest: { type: Number, default: 5 },
      free: { type: Number, default: 20 },
      pro: { type: Number, default: 200 },
      admin: { type: Number, default: 500 },
    },
    timezone: { type: String, default: 'UTC' },
    maintenanceMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ scope: 1 }, { unique: true });

export const PlatformConfig = mongoose.model('PlatformConfig', schema);
