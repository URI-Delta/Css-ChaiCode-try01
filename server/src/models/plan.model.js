import mongoose from 'mongoose';

const entitlementsSchema = new mongoose.Schema(
  {
    tracks: { type: String, default: 'all-free' }, // 'all' | 'all-free'
    challenges: { type: String, default: 'all-free' },
    projects: { type: String, default: 'all-free' },
    playground: { type: Boolean, default: true },
    aiTutor: { type: Boolean, default: true },
    certificates: { type: Boolean, default: false },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // 'free' | 'pro' | custom future plans
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true }, // minor units-free decimal; stripe uses metadata
    currency: { type: String, default: 'USD' },
    billingInterval: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' },
    features: [String], // marketing bullets
    entitlements: entitlementsSchema,
    quotas: { type: Number, default: 0 }, // AI requests per day; overrides env for the plan
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', schema);
