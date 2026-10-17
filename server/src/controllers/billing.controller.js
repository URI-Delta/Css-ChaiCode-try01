import { Router } from 'express';
import { asyncWrap } from '../utils/async.utils.js';
import { authenticate } from '../middleware/auth.js';
import * as billing from '../services/billing.service.js';
import { getPlans } from '../services/plan.service.js';

const router = Router();

router.get(
  '/plans',
  asyncWrap(async (_req, res) => {
    const plans = await getPlans();
    res.json({
      ok: true,
      plans: plans.map((p) => ({ id: p._id, name: p.name, title: p.title, description: p.description, price: p.price, currency: p.currency, billingInterval: p.billingInterval, features: p.features, entitlements: p.entitlements })),
    });
  })
);

router.get(
  '/subscription',
  authenticate,
  asyncWrap(async (req, res) => {
    const sub = await billing.getSubscriptionFor(req.user);
    res.json({
      ok: true,
      plan: req.user.plan,
      subscription: sub && {
        status: sub.status,
        provider: sub.provider,
        currentPeriodEnd: sub.currentPeriodEnd,
        history: (sub.history || []).slice(-10),
      },
      payments: billing.providerStatus(),
    });
  })
);

router.post(
  '/checkout',
  authenticate,
  asyncWrap(async (req, res) => {
    const result = await billing.createCheckout(req.user);
    res.json({ ok: true, ...result });
  })
);

router.post(
  '/cancel',
  authenticate,
  asyncWrap(async (req, res) => {
    const sub = await billing.cancelSubscription(req.user);
    res.json({ ok: true, status: sub.status });
  })
);

export default router;
