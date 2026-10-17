import { Plan } from '../models/plan.model.js';
import { env } from '../config/env.js';
import { PLANS } from '../config/constants.js';

const fallbackPlans = [
  {
    name: 'free',
    title: 'Free',
    description: 'Core lessons and the playground.',
    price: 0,
    currency: 'USD',
    billingInterval: 'monthly',
    features: ['All CSS Foundations lessons', 'Public playground', 'Daily challenges', 'Basic visualizers'],
    entitlements: { tracks: 'all-free', challenges: 'all-free', projects: 'all-free', playground: true, aiTutor: true, certificates: false },
    quotas: env.AI_DAILY_QUOTA_FREE,
    order: 0,
  },
  {
    name: 'pro',
    title: 'Pro',
    description: 'Every track, challenge and project — plus the AI tutor.',
    price: 9,
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      'Everything in Free',
      'All five learning tracks (incl. Advanced CSS)',
      'Pro-only challenges & projects',
      'Unlimited-ish AI tutor (daily quota)',
      'Project sharing links',
      'Priority support',
    ],
    entitlements: { tracks: 'all', challenges: 'all', projects: 'all', playground: true, aiTutor: true, certificates: true },
    quotas: env.AI_DAILY_QUOTA_PRO,
    order: 1,
  },
];

/** Seeds the two operands plans if empty. Administrator-editable afterwards. */
export async function ensureSeedPlans() {
  const count = await Plan.estimatedDocumentCount();
  if (count > 0) return;
  await Plan.insertMany(fallbackPlans);
}

let cached = null;
let cachedAt = 0;
const TTL = 60 * 1000;

export async function getPlans() {
  if (cached && Date.now() - cachedAt < TTL) return cached;
  let plans = await Plan.find({ active: true }).sort({ order: 1 }).lean();
  if (!plans.length) {
    plans = await Plan.insertMany(fallbackPlans, { ordered: true });
  }
  cached = plans;
  cachedAt = Date.now();
  return cached;
}

export async function getPlanByName(name) {
  const plans = await getPlans();
  return plans.find((p) => p.name === name) || plans.find((p) => p.name === PLANS.FREE);
}

/** Daily AI quota for a user (or guest).
 *  Precedence: admin-configured PlatformConfig quota → plan.quotas → env default. */
export async function resolveQuota(user) {
  const configs = await import('../models/platform-config.model.js').then((m) => m.PlatformConfig.findOne({ scope: 'ai' }).lean());
  const cfg = configs?.quotas || {};
  if (!user) return cfg.guest ?? env.AI_DAILY_QUOTA_GUEST;
  if (user.role === 'admin') return cfg.admin ?? env.AI_DAILY_QUOTA_ADMIN;
  const plan = await getPlanByName(user.plan || 'free');
  return cfg[user.plan] ?? plan?.quotas ?? (user.plan === PLANS.PRO ? env.AI_DAILY_QUOTA_PRO : env.AI_DAILY_QUOTA_FREE);
}
