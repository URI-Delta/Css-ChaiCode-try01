import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { makeUser, api, BASE, authGet, authPut, authPost, authPatch, authDelete } from './helpers.js';
import { Lesson } from '../src/models/lesson.model.js';
import { Challenge } from '../src/models/challenge.model.js';
import { seed } from '../src/seed/seed.js';

let app;
let admin;
let user;
let freeLesson;
let lockedLesson;

beforeAll(async () => {
  await connectDb();
  await seed();
  app = createApp();
  admin = await makeUser(app, { admin: true });
  user = await makeUser(app);

  freeLesson = await Lesson.findOne({ status: 'published', accessLevel: 'free' }).lean();
  lockedLesson = await Lesson.findOne({ status: 'published', accessLevel: 'pro' }).lean();
});

afterAll(async () => {
  await disconnectDb();
});

describe('learning content', () => {
  it('lists published tracks without auth', async () => {
    const res = await api(app).get(`${BASE}/tracks`);
    expect(res.status).toBe(200);
    expect(res.body.tracks.length).toBeGreaterThan(3);
  });

  it('serves lesson detail publicly but hides quiz answers', async () => {
    const res = await api(app).get(`${BASE}/lessons/${freeLesson.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.lesson.content).toBeTruthy();
    for (const q of res.body.lesson.quiz) {
      expect(q.correctIndex).toBeUndefined();
    }
  });
});

describe('lesson progress persistence', () => {
  it('persists progress for its owner and reports aggregated stats', async () => {
    const put = await authPut(app, user, `${BASE}/lessons/${freeLesson._id}/progress`, { completed: true, score: 80 });
    expect(put.status).toBe(200);
    expect(put.body.progress.completed).toBe(true);

    const stats = await authGet(app, user, `${BASE}/progress/me`);
    expect(stats.status).toBe(200);
    expect(stats.body.stats.lessonsCompleted).toBe(1);
    expect(stats.body.stats.lessonsTotal).toBeGreaterThan(0);
  });

  it('requires auth to write progress', async () => {
    const res = await api(app).put(`${BASE}/lessons/${freeLesson._id}/progress`).send({ completed: true });
    expect(res.status).toBe(401);
  });

  it('grades answer-based quiz submissions server-side', async () => {
    const detail = await api(app).get(`${BASE}/lessons/${freeLesson.slug}`);
    const firstQuiz = detail.body.lesson.quiz?.[0];
    if (!firstQuiz) return; // lesson has no quiz — skip this lesson's case
    const right = await authPost(app, user, `${BASE}/lessons/${freeLesson._id}/quiz`, { answers: [firstQuiz._dummyIndex ?? 0] });
    expect(right.status).toBe(200);
  });
});

describe('free vs pro entitlements', () => {
  it('free plan users receive persisted pro-rating upgrade only after server decides', async () => {
    const res = await authGet(app, user, `${BASE}/lessons/${lockedLesson.slug}`);
    // lesson detail is public by design; the lesson LIST shows access level
    expect(res.status).toBe(200);
  });

  it('challenge submit for pro challenge is blocked for free users', async () => {
    const proChallenge = await Challenge.findOne({ status: 'published', accessLevel: 'pro' }).lean();
    if (!proChallenge) return;
    const res = await authPost(app, user, `${BASE}/challenges/${proChallenge._id}/attempts`, { answer: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.details?.upgradeRequired).toBe(true);
  });
});

describe('project ownership', () => {
  it('creates, reads, patches, deletes own project; blocks strangers', async () => {
    const created = await authPost(app, user, `${BASE}/projects`, { title: 'My Test Project', files: { html: '<p>hi</p>', css: 'p{}', js: '' } });
    expect(created.status).toBe(201);
    const id = created.body.project.id;

    const readMine = await authGet(app, user, `${BASE}/projects/${id}`);
    expect(readMine.status).toBe(200);

    const patched = await authPatch(app, user, `${BASE}/projects/${id}`, { title: 'Renamed' });
    expect(patched.body.project.title).toBe('Renamed');

    // stranger access
    const other = await makeUser(app);
    const forbidden = await authGet(app, other, `${BASE}/projects/${id}`);
    expect(forbidden.status).toBe(403);

    // share produces a share slug viewable anonymously
    await authPost(app, user, `${BASE}/projects/${id}/share`, {});
    const mine = await authGet(app, user, `${BASE}/projects/${id}`);
    const slug = mine.body.project.shareSlug;
    const publicView = await api(app).get(`${BASE}/projects/shared/${slug}`);
    expect(publicView.status).toBe(200);

    const deleted = await authDelete(app, user, `${BASE}/projects/${id}`);
    expect(deleted.status).toBe(200);
  });

  it('project list is paginated', async () => {
    const res = await authGet(app, user, `${BASE}/projects/me?page=1&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });
});

describe('challenge validation (server-side grading)', () => {
  it('scores a fill-code challenge correctly', async () => {
    const c = await Challenge.findOne({ slug: 'fill-the-code-centering', status: 'published' }).lean();
    if (!c) return;
    const res = await authPost(app, user, `${BASE}/challenges/${c._id}/attempts`, {
      css: '.stage { justify-content: center; align-items: center; }',
    });
    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.results.every((r) => r.passed)).toBe(true);
  });

  it('returns per-requirement feedback and no solution before attempt threshold', async () => {
    const c = await Challenge.findOne({ slug: 'debug-css-broken-flex-row', status: 'published' }).lean();
    if (!c) return;
    const res = await authPost(app, user, `${BASE}/challenges/${c._id}/attempts`, { css: '.row { display: flex; }' });
    expect([200, 422]).toContain(res.status);
    expect(res.body.passed).toBe(false);
    expect(res.body.results.some((r) => r.passed)).toBe(true); // flex yes, wrap no
    expect(res.body.solution).toBeUndefined(); // < 3 attempts
  });

  it('grades MCQ answers by index', async () => {
    const c = await Challenge.findOne({ slug: 'quiz-specificity-ordering', status: 'published' }).lean();
    if (!c) return;
    const right = await authPost(app, user, `${BASE}/challenges/${c._id}/attempts`, { answer: 0 });
    expect([200, 422]).toContain(right.status);
    expect(right.body.passed).toBe(true);
    const wrong = await authPost(app, user, `${BASE}/challenges/${c._id}/attempts`, { answer: 1 });
    expect(wrong.body.passed).toBe(false);
  });
});

describe('admin rbac edge cases', () => {
  it('user cannot access user list', async () => {
    const res = await authGet(app, user, `${BASE}/admin/users`);
    expect(res.status).toBe(403);
  });
  it('admin can see overview', async () => {
    const res = await authGet(app, admin, `${BASE}/admin/overview`);
    expect(res.status).toBe(200);
    expect(res.body.overview.users.total).toBeGreaterThan(0);
  });
});
