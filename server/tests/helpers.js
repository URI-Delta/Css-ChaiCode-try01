import request from 'supertest';

export const api = (app) => request(app);
export const BASE = '/api/v1';

/** Registers + logs in a user, returns { user, cookie } with both auth cookies. */
export async function makeUser(app, { name = 'Test User', email, password = 'Password123', admin = false, pro = false } = {}) {
  const emailAddr = email || `user-${Math.random().toString(36).slice(2)}@test.dev`;
  const res = await api(app).post(`${BASE}/auth/register`).send({ name, email: emailAddr, password });
  if (!res.status.toString().startsWith('2')) throw new Error(`register failed: ${JSON.stringify(res.body)}`);

  const cookie = extractCookies(res);
  if (admin || pro) {
    // direct DB promotion — the ONLY place client-side plan/role switching is simulated in tests
    const { default: mongoose } = await import('mongoose');
    const users = mongoose.connection.collection('users');
    await users.updateOne({ email: emailAddr }, { $set: admin ? { role: 'admin' } : { plan: 'pro' } });
  }
  return { email: emailAddr, password, cookie: cookie.join('; ') };
}

export function extractCookies(res) {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.map((c) => c.split(';')[0]);
}

export const authGet = (app, user, url) => api(app).get(url).set('Cookie', user.cookie);
export const authPost = (app, user, url, body) => api(app).post(url).set('Cookie', user.cookie).send(body);
export const authPut = (app, user, url, body) => api(app).put(url).set('Cookie', user.cookie).send(body);
export const authPatch = (app, user, url, body) => api(app).patch(url).set('Cookie', user.cookie).send(body);
export const authDelete = (app, user, url, body) => api(app).delete(url).set('Cookie', user.cookie).send(body);
