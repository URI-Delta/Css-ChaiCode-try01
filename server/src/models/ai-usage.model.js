import mongoose from 'mongoose';

/** One document per (userKey, dayBucket) — quota enforcement does a single upsert with $inc,
 *  which is atomic, so concurrent requests cannot bypass the daily limit. */
const schema = new mongoose.Schema(
  {
    /** userId string, or `guest:<ip64>` / `guest:<sessionid>` for anonymous users */
    userKey: { type: String, required: true, index: true },
    /** Calendar-day bucket computed in the configured timezone, e.g. "2026-10-16" */
    day: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    requests: { type: Number, default: 0 },
    tokensIn: { type: Number, default: 0 },
    tokensOut: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.index({ userKey: 1, day: 1 }, { unique: true });

export const AIUsage = mongoose.model('AIUsage', schema);
