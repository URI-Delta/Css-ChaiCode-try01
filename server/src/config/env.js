import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000).transform((v) => (v > 0 ? v : 4000)),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),

    MONGODB_URI: z
      .string()
      .default('mongodb://127.0.0.1:27017/css-visual')
      .refine((v) => !v.includes('<password>'), { message: 'Replace the <password> placeholder in MONGODB_URI with the real credentials' }),
    MONGODB_URI_TEST: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me-16+chars'),
    JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me-16+chars'),
    COOKIE_SECRET: z.string().min(16).default('dev-cookie-secret-change-me-16+chars'),

    AI_PROVIDER: z.enum(['openai', 'openai-compatible', 'none', '']).default(''),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('gpt-4o-mini'),
    AI_BASE_URL: z.string().url().optional(),
    AI_MAX_TOKENS: z.coerce.number().int().positive().default(1024),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
    AI_DAILY_QUOTA_GUEST: z.coerce.number().int().default(5),
    AI_DAILY_QUOTA_FREE: z.coerce.number().int().default(20),
    AI_DAILY_QUOTA_PRO: z.coerce.number().int().default(200),
    AI_DAILY_QUOTA_ADMIN: z.coerce.number().int().default(500),
    AI_TIMEZONE: z.string().default('UTC'),

    PAYMENT_PROVIDER: z.enum(['stripe', 'razorpay', 'none', '']).default('none'),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID_PRO: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('CSS Visual <no-reply@cssvisual.app>'),

    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
  })
  .passthrough();

// Empty-string env entries (common in CI/sandboxes) are treated as unset so defaults apply.
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '' && v != null));
const parsed = schema.safeParse(cleanEnv);
if (!parsed.success) {
  const lines = parsed.error.issues
    .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`[env] Invalid environment variables:\n${lines}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Startup warnings for things that only matter in production.
const prodWarnings = [];
if (isProd) {
  if (!parsed.data.JWT_ACCESS_SECRET || parsed.data.JWT_ACCESS_SECRET.startsWith('dev-'))
    prodWarnings.push('JWT_ACCESS_SECRET must be a strong random value in production');
  if (!parsed.data.JWT_REFRESH_SECRET || parsed.data.JWT_REFRESH_SECRET.startsWith('dev-'))
    prodWarnings.push('JWT_REFRESH_SECRET must be a strong random value in production');
  if (!parsed.data.CLIENT_URL.startsWith('https://'))
    prodWarnings.push('CLIENT_URL should be https in production');
}
if (prodWarnings.length) {
  // eslint-disable-next-line no-console
  console.warn(`[env] Production warnings:\n${prodWarnings.map((w) => `  - ${w}`).join('\n')}`);
}

export const serverUrl = `http://localhost:${env.PORT}`;

/** AI tutor is enabled only when a provider + key are present. */
export const aiConfigured = Boolean((env.AI_PROVIDER === 'openai' || env.AI_PROVIDER === 'openai-compatible') && env.AI_API_KEY);
export const paymentsConfigured = env.PAYMENT_PROVIDER === 'stripe' || env.PAYMENT_PROVIDER === 'razorpay';
export const emailConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
