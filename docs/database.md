# Database (MongoDB / Mongoose)

Connection string via `MONGODB_URI` (default `mongodb://127.0.0.1:27017/css-visual`); tests use `css-visual-test`. Auto-index building is on for dev/test and off in production startup.

## Collections

**users** — name, email (unique), passwordHash (excluded by default), role(`user|admin`), plan(`free|pro`), emailVerified, status(`active|suspended`), preferences, token hashes for verify/reset, passwordChangedAt.
*Indexes:* `email` unique, `role`, `plan`, `status`.

**sessions** — userId, tokenHash (sha256 refresh token, unique), expiresAt, revoked(+At), replacedByHash, device{userAgent,ip}.
*Indexes:* `tokenHash` unique, `userId`, `expiresAt`, `revoked`.

**tracks** — title, slug (unique), emoji, description, order, accessLevel(`free|pro`), published, lessonsCount (denormalized).

**lessons** — title, slug (unique), trackId→tracks, order, objectives [], status(`draft|published`), accessLevel, difficulty, content (markdown), codeExamples [], quiz[] (with secret answer index), visualizer + visualizerConfig.
*Indexes:* `trackId,order`, `status`, `accessLevel`.

**lessonprogresses** — userId, lessonId; completed(+At), score, lastVisitedAt.
*Indexes:* `userId+lessonId` **unique**, `userId+completed`, `lastVisitedAt`.

**challenges** — title, slug (unique), type (fill-code/debug/visual-target/responsive/multiple-choice/fill-blank), starter, target, validation.rules[] (declarative or css-ast checks), hints[], solution (hidden until 3 failed attempts), points, accessLevel, status.
**challengeattempts** — userId, challengeId, passed, score, per-rule result[], submission summary (kind, size, answer snippet).
*Indexes:* `userId+challengeId+attemptedAt`.

**projecttemplates** — title, slug (unique), starterFiles{html,css,js}, objectives, requirements, hints, solution, completionCriteria.

**userprojects** — userId, title, templateId/Slug, files{html,css,js}, visibility(`private|shared|public`), shareSlug (unique sparse), version.
*Indexes:* `userId+updatedAt`, `shareSlug` unique sparse.

**bookmarks** — userId, resourceType, resourceId (unique triple), meta snapshot.

**achievements** / **userachievements** — declarative criteria (lessons/challengesPassed/projects/streak); awarded when any threshold is crossed. `userId+achievementId` unique.

**subscriptions** — userId, provider, providerCustomerId, providerSubscriptionId, planId, status (`incomplete|active|trialing|past_due|canceled|expired`), period dates, history[].

**plans** — name (free/pro), title, price, currency, billingInterval, features[], entitlements, quotas, active. Seeded from env defaults; editable by admin.

**aiusages** — ONE doc per (userKey, day bucket in configured timezone): requests, tokensIn/Out, estimatedCostUsd. Uniqueness (`userKey,day`) + conditional `$inc` yields race-safe daily quotas.

**conversations** — userId or guestKey, lessonSlug, messages[] (role-capped content), lastActiveAt, expiresAt (7 days).

**notifications** — userId, type, title, message, readAt. *Indexes:* `userId+createdAt`, `readAt`.

**auditlogs** — actorId/actorEmail, action, targetType/targetId, metadata (excluded by default), ip, at. Written for admin mutations + security-relevant user actions.

**platformconfigs** — singleton (`scope:'ai'`) holding quotås {guest,free,pro,admin}, timezone, maintenanceMode.

## Query pattern rules
- Everything user-scoped filters by `userId` from the JWT — never from client-supplied ids.
- All admin lists paginate (`page`/`limit`, bounded ≤ 60) and sort by stable fields.
- Aggregations for dashboards/analytics read `lessonprogresses`, `challengeattempts`, `aiusages` — no synthetic data anywhere.
