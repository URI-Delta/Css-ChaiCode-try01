import { env, paymentsConfigured } from '../config/env.js';
import { AppError } from '../config/errors.js';
import { Plan } from '../models/plan.model.js';
import { Subscription } from '../models/subscription.model.js';
import { User } from '../models/user.model.js';
import { PLANS } from '../config/constants.js';
import { notFound } from '../config/errors.js';
import { log } from '../config/logger.js';

// stripe is a regular dependency but is imported lazily so the app boots
// and runs cleanly even when no payment credentials are configured.
let stripeClient = null;
async function getStripe() {
  if (env.PAYMENT_PROVIDER !== 'stripe' || !env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    const { default: StripeCtor } = await import('stripe');
    stripeClient = new StripeCtor(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function providerStatus() {
  return {
    provider: env.PAYMENT_PROVIDER || null,
    configured: paymentsConfigured && (env.PAYMENT_PROVIDER !== 'stripe' ? Boolean(env.RAZORPAY_KEY_ID) : Boolean(env.STRIPE_SECRET_KEY)),
  };
}

export async function getPlansPublic() {
  return Plan.find({ active: true }).sort({ order: 1 }).select('-__v').lean();
}

/**
 * Create a Stripe Checkout session for upgrading to Pro.
 * Entitlement only ever becomes real through the webhook handler below
 * (checkout.session.completed / customer.subscription.updated) — never from the front end.
 */
export async function createCheckout(user) {
  const s = await getStripe();
  if (!s) {
    throw new AppError('Payments are not configured on this deployment. Set PAYMENT_PROVIDER and credentials.', 503, 'PAYMENTS_NOT_CONFIGURED');
  }
  const plan = await Plan.findOne({ name: PLANS.PRO, active: true }).lean();
  if (!plan) throw notFound('Pro plan is not available');
  if (!env.STRIPE_PRICE_ID_PRO) {
    throw new AppError('Server has no Stripe price configured for Pro (STRIPE_PRICE_ID_PRO).', 503, 'PAYMENTS_NOT_CONFIGURED');
  }

  const session = await s.checkout.sessions.create({
    customer: await customerIdFor(user),
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${env.CLIENT_URL}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/billing?checkout=cancelled`,
    client_reference_id: String(user.id),
    metadata: { userId: String(user.id), plan: PLANS.PRO },
  });
  return { url: session.url, sessionId: session.id };
}

async function customerIdFor(user) {
  const sub = await Subscription.findOne({ userId: user.id, provider: 'stripe' }).lean();
  if (sub?.providerCustomerId) return sub.providerCustomerId;
  const customer = await (await getStripe()).customers.create({ email: user.email, name: user.name, metadata: { userId: String(user.id) } });
  await Subscription.create({ userId: user.id, provider: 'stripe', planName: PLANS.PRO, providerCustomerId: customer.id, status: 'incomplete' });
  return customer.id;
}

export async function getSubscriptionFor(user) {
  const sub = await Subscription.findOne({ userId: user.id }).sort({ createdAt: -1 }).lean();
  return sub;
}

/* ── webhook handling — the only path that grants Pro ─────────── */

export async function handleStripeWebhook(rawBody, signature) {
  const s = await getStripe();
  if (!s || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Webhooks are not configured', 503, 'PAYMENTS_NOT_CONFIGURED');
  }
  let event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError('Invalid webhook signature', 400, 'WEBHOOK_INVALID');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.metadata?.plan === PLANS.PRO) {
        await activatePro(session.metadata.userId, 'stripe', session.subscription ?? session.id, 'checkout.session.completed');
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const local = await Subscription.findOne({ providerSubscriptionId: sub.id });
      if (local) {
        const active = ['active', 'trialing'].includes(sub.status);
        local.status = active ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
        local.currentPeriodStart = new Date(sub.current_period_start * 1000);
        local.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        local.history.push({ at: new Date(), event: event.type, note: sub.status });
        await local.save();
        await User.updateOne({ _id: local.userId }, { plan: active ? PLANS.PRO : PLANS.FREE });
      }
      break;
    }
    default:
      break;
  }
  log.info('Stripe webhook processed', { type: event.type, eventId: event.id });
  return { received: true };
}

export async function activatePro(userId, provider, providerSubscriptionId, note) {
  const plan = await Plan.findOne({ name: PLANS.PRO }).lean();
  if (!plan) return;
  await Subscription.updateOne(
    { userId, provider },
    {
      $set: {
        planId: plan._id,
        planName: PLANS.PRO,
        status: 'active',
        providerSubscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
      },
      $push: { history: { at: new Date(), event: 'activated', note } },
    },
    { upsert: true }
  );
  await User.updateOne({ _id: userId }, { plan: PLANS.PRO });
}

export async function cancelSubscription(user) {
  const sub = await Subscription.findOne({ userId: user.id, status: 'active' });
  if (!sub) throw notFound('No active subscription');
  const s = await getStripe();
  if (sub.provider === 'stripe' && sub.providerSubscriptionId && s) {
    try {
      await s.subscriptions.cancel(sub.providerSubscriptionId);
    } catch (err) {
      log.warn('Stripe cancel failed, applying locally', { message: err.message });
    }
  }
  sub.status = 'canceled';
  sub.history.push({ at: new Date(), event: 'canceled', note: 'user-initiated' });
  await sub.save();
  await User.updateOne({ _id: user.id }, { plan: PLANS.FREE });
  return sub;
}
