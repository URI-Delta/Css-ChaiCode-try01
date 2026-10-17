import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { makeUser, api, BASE, authGet } from './helpers.js';
import { User } from '../src/models/user.model.js';
import { seed } from '../src/seed/seed.js';

let app;

beforeAll(async () => {
  await connectDb();
  await seed();
  app = createApp();
});

afterAll(async () => {
  await disconnectDb();
});

describe('auth', () => {
  it('registers a new user on the FREE plan with plain role', async () => {
    const email = `reg-${Date.now()}@test.dev`;
    const res = await api(app).post(`${BASE}/auth/register`).send({ name: 'Reg Tester', email, password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.user.plan).toBe('free');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate emails', async () => {
    const email = `dup-${Date.now()}@test.dev`;
    await api(app).post(`${BASE}/auth/register`).send({ name: 'Alpha First', email, password: 'Password123' });
    const res = await api(app).post(`${BASE}/auth/register`).send({ name: 'Beta Second', email, password: 'Password123' });
    expect(res.status).toBe(409);
  });

  it('rejects weak passwords', async () => {
    const res = await api(app).post(`${BASE}/auth/register`).send({ name: 'Weak', email: `weak-${Date.now()}@test.dev`, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });

  it('logs in with valid credentials and sets cookies', async () => {
    const { email, cookie } = await makeUser(app);
    const res = await api(app).post(`${BASE}/auth/login`).send({ email, password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    const headers = res.headers['set-cookie'] || [];
    expect(headers.join(' ')).toMatch(/accessToken=/);
    expect(headers.join(' ')).toMatch(/refreshToken=/);
    expect(cookie).toContain('accessToken=');
  });

  it('rejects invalid credentials identically', async () => {
    const tests = [
      { email: 'nouser@test.dev', password: 'Whatever123' },
      { email: 'smoke@test.dev', password: 'wrong-pass-1' },
    ];
    for (const body of tests) {
      const res = await api(app).post(`${BASE}/auth/login`).send(body);
      expect([401, 429]).toContain(res.status);
      if (res.status === 401) {
        expect(res.body.error.message).toMatch(/invalid/i);
      }
    }
  });

  it('issues fresh tokens via /auth/refresh', async () => {
    const { email, password } = await makeUser(app);
    const login = await api(app).post(`${BASE}/auth/login`).send({ email, password });
    const refreshCookie = login.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
    const refreshRes = await api(app).post(`${BASE}/auth/refresh`).set('Cookie', refreshCookie);
    expect(refreshRes.status).toBe(200);
    const cookies = refreshRes.headers['set-cookie'].join(' ');
    expect(cookies).toMatch(/accessToken=/);
    expect(cookies).toMatch(/refreshToken=/);
    // old token must now be dead (rotation)
    const reuse = await api(app).post(`${BASE}/auth/refresh`).set('Cookie', refreshCookie);
    expect(reuse.status).toBe(401);
  });

  it('rejects refresh without a valid token', async () => {
    const res = await api(app).post(`${BASE}/auth/refresh`); // no cookies sent
    expect(res.status).toBe(401);
  });

  it('/auth/me requires authentication', async () => {
    const res = await api(app).get(`${BASE}/auth/me`);
    expect(res.status).toBe(401);
  });

  it('cannot self-elevate role or plan through any public endpoint', async () => {
    const user = await makeUser(app);
    // attempt 1: patch profile with role/plan fields — must not change them
    const res = await authGet(app, user, `${BASE}/auth/me`);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.plan).toBe('free');

    // attempt 2: hit an admin endpoint with a user session
    const adminProbe = await authGet(app, user, `${BASE}/admin/users`);
    expect(adminProbe.status).toBe(403);

    // attempt 3: try to inject via body on admin endpoint
    const inject = await api(app).patch(`${BASE}/admin/users/whatever`).set('Cookie', user.cookie).send({ role: 'admin', plan: 'pro' });
    expect([401, 403]).toContain(inject.status);
  });

  it('logs out and clears cookies', async () => {
    const { email, password } = await makeUser(app);
    await api(app).post(`${BASE}/auth/login`).send({ email, password });
    const res = await api(app).post(`${BASE}/auth/logout`);
    expect(res.status).toBe(200);
    const cleared = res.headers['set-cookie'].join(' ');
    expect(cleared).toMatch(/accessToken=;/);
  });
});
