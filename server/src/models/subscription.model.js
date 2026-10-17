import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    planName: { type: String, default: 'pro' },
    provider: { type: String, enum: ['stripe', 'razorpay'], required: true, index: true },
    providerCustomerId: String,
    providerSubscriptionId: { type: String, index: true },
    status: {
      type: String,
      enum: ['incomplete', 'active', 'trialing', 'past_due', 'canceled', 'expired'],
      default: 'incomplete',
      index: true,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    history: [
      {
        at: Date,
        event: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

schema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model('Subscription', schema);
