# REST API — `/api/v1`

Conventions: JSON in/out. Success: `{ ok: true, ... }`. Errors: `{ ok: false, error: { code, message, details? } }` with correct HTTP status. Auth = HttpOnly cookies (`accessToken`, `refreshToken`); `Authorization: Bearer` also accepted for tooling.

Health check: `GET / health` → `{ ok, status:'healthy', uptime, time }` (rate-limited by global limiter).

## Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | — | name/email/password; always `role:'user'`, `plan:'free'`; rate-limited; 409 dup |
| POST | `/auth/login` | — | throttled per-email (5 fails → 10 min lock) |
| POST | `/auth/refresh` | refresh cookie | rotates refresh token; reuse revokes the session line |
| POST | `/auth/logout` | — | revokes session, clears cookies |
| GET | `/auth/me` | ✓ | profile (no passwordHash) |
| POST | `/auth/forgot-password` | — | enumerates identically; 1h single-use hashed token |
| POST | `/auth/reset-password` | — | consumes token, bumps `passwordChangedAt` |
| POST | `/auth/verify-email` | — | consumes hashed verify token |
| POST | `/auth/verify-email/resend` | ✓ | regenerates + emails |

## Learning
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/tracks` / `/tracks/:slug` | — | published only |
| GET | `/lessons?track=` | — | catalog; quiz `correctIndex` never exposed pre-submit |
| GET | `/lessons/:slug` | — | content, codeExamples, quiz (no answers), prev/next |
| PUT | `/lessons/:id/progress` | ✓ | `{ completed?, score? }`; atomically upserted |
| POST | `/lessons/:id/quiz` | ✓ | server grades against `correctIndex` |
| GET | `/progress/me` | ✓ | aggregated dashboard stats (real records only) |
| GET | `/achievements/me` | ✓ | with `awardedAt` per badge |
| GET | `/leaderboard` | — | top 10 by completed lessons (masked names) |

## Projects / playground
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/projects/templates` / `/templates/:slug` | — | published starters |
| POST | `/projects` | ✓ | create/fork a starter into workspace |
| GET | `/projects/me` | ✓ | paginated |
| GET/PATCH/DELETE | `/projects/:id` | ✓ | 403 for strangers |
| POST | `/projects/:id/fork` | ✓ | public/shared or own |
| POST | `/projects/:id/share` | ✓ | issues read-only `shareSlug` |
| GET | `/projects/shared/:slug` | — | read-only view |

## Challenges
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/challenges` / `/challenges/:slug` | — | pro items flag `locked` |
| POST | `/challenges/:id/attempts` | ✓ | grading server-side; `hintIndex` request returns hint only; per-rule `results`; solution after 3 failed attempts |
| GET | `/challenges/:id/attempts/me` | ✓ | last 20 + bestPassed |

## AI tutor
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/ai/chat` | optional (guest ok) | 503 `AI_NOT_CONFIGURED` when unset; 429 `AI_QUOTA_EXCEEDED` at daily cap; 10/min per identity; atomic daily reservation |
| GET | `/ai/usage` | optional | `{ configured, used, quota }` |
| GET | `/ai/conversations` , `/ai/conversations/:id` | ✓ | own conversations only |

## Billing
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/billing/plans` | — | admin-configurable plans |
| GET | `/billing/subscription` | ✓ | status + payments configurability |
| POST | `/billing/checkout` | ✓ | Stripe Checkout URL or 503 config-required |
| POST | `/billing/cancel` | ✓ | cancels provider sub, downgrades to free |
| POST | `/billing/webhooks/stripe` | signature | grants/revokes Pro **only** here |

## Me (profile/security/notifications/bookmarks)
`GET/PATCH /me/profile` · `PATCH /me/preferences` · `POST /me/password/change` (revokes all sessions) · `GET /me/sessions` · `POST /me/sessions/revoke-all` · `GET/POST/DELETE /me/bookmarks` · `GET /me/notifications` · `POST /me/notifications/read`

## Admin (role: admin, server-enforced)
`GET /admin/overview` · `GET /admin/users` (+filters, pagination) · `GET/PATCH /admin/users/:id` (status/plan/role; last-admin guarded) ·
`GET /admin/content` · `POST/PATCH /admin/tracks` · `POST/PATCH/DELETE /admin/lessons` + `POST /admin/lessons/reorder` ·
`POST/PATCH /admin/challenges` · `POST/PATCH /admin/projects` ·
`GET /admin/plans` · `PATCH /admin/plans/:id` · `PATCH /admin/ai-config` (quotas/timezone/maintenance) ·
`GET /admin/analytics` · `GET /admin/audit-logs` (metadata redacted)
