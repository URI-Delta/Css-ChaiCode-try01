# Deployment guide

## Production build

```bash
# 1. API
cd server
npm ci --omit=dev
NODE_ENV=production node src/server.js        # or a process manager (pm2 / systemd / Docker)

# 2. SPA
cd client
npm ci
npm run build                                  # → client/dist/
# serve client/dist with any static host + reverse proxy /api to the API.
```

## Required production configuration (server .env)

```ini
NODE_ENV=production
PORT=4000
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/css-visual

JWT_ACCESS_SECRET=<48-byte random hex>
JWT_REFRESH_SECRET=<different 48-byte random hex>
COOKIE_SECRET=<32+ byte random>

MONGODB_URI_TEST=                     # leave empty in prod
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Optional integrations

**AI tutor**
```ini
AI_PROVIDER=openai            # or openai-compatible with AI_BASE_URL
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```
Without these the tutor renders a clear "not configured" state and the platform works fully.

**Payments (Stripe)**
```ini
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...         # recurring price for the Pro plan
```
Register the webhook endpoint `https://yourdomain.com/api/v1/billing/webhooks/stripe` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Pro access flips only on those verified events.

**Email (SMTP)**
```ini
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM="CSS Visual <no-reply@yourdomain.com>"
```
Without SMTP, verification/reset links print to server logs (dev convenience only — configure SMTP in production).

## Reverse proxy notes
- Terminate TLS; forward `X-Forwarded-For` (the API sets `trust proxy = 1`).
- Restrict CORS: set `CLIENT_URL` to the exact https origin.
- Static assets: cache-busted by Vite hashes; `index.html` no-cache.

## Database backups
- **Atlas**: enable continuous backups / scheduled snapshots per tier.
- **Self-hosted**: cron `mongodump --uri="$MONGODB_URI" --gzip --archive=/backups/css-visual-$(date +%F).gz` and offload to object storage. This app ships no backup automation by default — wire one before going live.

## Admin bootstrap
```bash
SEED_ADMIN_EMAIL=ops@yourdomain.com SEED_ADMIN_PASSWORD=<strong> npm run seed:admin
# then rotate the password from /login (and in your password manager)
```

## Checklist before launch
- [ ] Strong JWT/cookie secrets (startup warnings fail loudly otherwise)
- [ ] https CLIENT_URL, CORS allowlist matches
- [ ] Webhook secret configured & events verified in Stripe dashboard
- [ ] SMTP configured (otherwise reset emails never deliver in prod — logged as error)
- [ ] MongoDB Atlas connection with least-privilege user
- [ ] Backups scheduled and restore tested
- [ ] `npm run test:server` green on the deployment image
