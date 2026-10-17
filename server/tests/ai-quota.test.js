import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import {
  ensurePlatformConfig,
  reserveAiQuota,
  userKeyFor,
  setProviderOverride,
  isAiEnabled,
} from '../src/services/ai.service.js';
import { quotaExceeded } from '../src/config/errors.js';
import { makeUser, api, BASE } from './helpers.js';
import { AIUsage } from '../src/models/ai-usage.model.js';
import { PlatformConfig } from '../src/models/platform-config.model.js';

let app;
let user;

beforeAll(async () => {
  await connectDb();
  await ensurePlatformConfig();
  app = createApp();
  user = await makeUser(app);
});

afterAll(async () => {
  await disconnectDb();
});

describe('ai tutor graceful degradation (unconfigured)', () => {
  it('returns AI_NOT_CONFIGURED (503) and does not consume quota', async () => {
    const res = await api(app).post(`${BASE}/ai/chat`).send({ message: 'what is flexbox?' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
    expect(res.body.error.message).toMatch(/not configured/i);
  });

  it('reports usage status even without a provider', async () => {
    const res = await api(app).get(`${BASE}/ai/usage`);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.quota).toBeGreaterThan(0);
  });
});

describe('ai daily quota (configured via test override)', () => {
  it('caps requests atomically — 50 concurrent reservations honor the quota', async () => {
    const key = 'concurrent-user';
    await AIUsage.deleteOne({ userKey: key });
    await PlatformConfig.updateOne({ scope: 'ai' }, { $set: { 'quotas.free': 5 } });

    const settle = await Promise.allSettled(
      Array.from({ length: 50 }, () =>
        reserveAiQuota(key, { plan: 'free', role: 'user' }).then(
          () => 'ok',
          (err) => {
            if (err.code !== 'AI_QUOTA_EXCEEDED') throw err;
            return 'capped';
          }
        )
      )
    );
    const accepted = settle.filter((r) => r.status === 'fulfilled' && r.value === 'ok').length;
    const capped = settle.filter((r) => r.status === 'fulfilled' && r.value === 'capped').length;
    expect(accepted).toBe(5);
    expect(capped).toBe(45);
    const saved = await AIUsage.findOne({ userKey: key });
    expect(saved.requests).toBe(5);

    // restore default
    await PlatformConfig.updateOne({ scope: 'ai' }, { $set: { 'quotas.free': 20 } });
  });

  it('chat endpoint enforces the cap against the unconfigured provider path', async () => {
    // bring a fake provider "online" for this test
    setProviderOverride(true);
    expect(isAiEnabled()).toBe(true);

    const origFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'Flexbox is a layout system.' } }], usage: { prompt_tokens: 10, completion_tokens: 6 } }),
    });

    try {
      for (let i = 0; i < 3; i++) {
        const res = await api(app).post(`${BASE}/ai/chat`).send({ message: `hello ${i}` });
        expect([200, 429]).toContain(res.status);
      }
      const finalCheck = await api(app).get(`${BASE}/ai/usage`);
      expect(finalCheck.body.used).toBeGreaterThanOrEqual(1);
    } finally {
      global.fetch = origFetch;
      setProviderOverride(null);
    }
  });
});
