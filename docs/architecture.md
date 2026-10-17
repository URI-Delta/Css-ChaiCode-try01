# Architecture

## Monorepo layout

```
css-visual/
  client/                 Vite + React 19 SPA
    src/
      app/App.jsx         Router (lazy routes), guards, providers
      components/         common (ui kit), layout, editor, visualizers, charts
      features/<area>/    auth, learning, playground, challenges, projects,
                          progress, settings, billing, admin, ai-tutor, …
      services/api.js     axios instance + 401→refresh interceptor
      store/              zustand: authStore, uiStore
      styles/index.css    design tokens + Tailwind wiring
  server/                 Express 5 API
    src/
      config/             env (zod-validated), db, logger, constants, errors
      models/             19 Mongoose models (User, Session, Track, Lesson, …)
      controllers/        HTTP handlers per resource
      services/           business rules (auth, grader, ai, billing, progress…)
      middleware/         auth, validate, rate-limit, error-handler, audit
      routes/index.js     /api/v1 registry
      seed/               idempotent seeding + admin creation
      jobs/               hourly cleanup (expired sessions/conversations)
      server.js           bootstrap + graceful shutdown
  docs/
```

## Request flow

1. **Vite dev server** proxies `/api/*` → `http://localhost:4000` (no CORS issues in dev; CORS is allowlisted to `CLIENT_URL` in prod).
2. **Cookie auth**: short-lived access JWT (15 min) + rotating refresh token (7 days). Changed-password timestamps invalidate pre-existing access tokens (`passwordChangedAt` check).
3. **Refresh rotation**: each refresh revokes the prior session row and marks `replacedByHash`; reuse of a rotated token revokes the chain (leak detection).
4. **Validation**: zod schemas transform request body/params/query; a `sanitizeJson` middleware strips `$`-prefixed keys and dotted keys from bodies so Mongo operators can't be injected.
5. **Authorization**: `authenticate` (JWT→user), `authorize(...roles)` (admin guard), `requirePlan('pro')` (subscription entitlement). Content checks in controllers use server-derived `user.plan`.
6. **Centralized errors**: `AppError`-typed failures → JSON envelope `{ ok:false, error:{code,message,details} }`. Structured JSON logs with redaction of secret keys.

## Key subsystems

### Challenge grader — `server/src/services/grader.service.js`
- Parses submitted CSS with an **eval-free** scanner (handles @media/@supports recursion, strips comments).
- Rules are declarative: `{ selector?, property, op: has|equals|matches|any-of, values }` against either the parsed CSS (engine `css-ast`) or sandbox-computed layout facts (engine `declarative`).
- Attempts are recorded per user+challenge; per-requirement feedback and progressively revealed hints/solutions (solution locked until 3 failed attempts).

### AI tutor — `server/src/services/ai.service.js`
- Provider adapter: OpenAI-compatible `/chat/completions` via fetch, timeout, enumerable status (`aiStatus()`).
- Quotas: one `AIUsage` doc per (identity, calendar-day in configured timezone). Reservation is a **conditional atomic update** (`requests: { $lt: quota }`) so concurrent requests can't exceed the cap; guests are keyed by a hashed session id.
- Identity: registered users key on `user.id`; guests on `sha256(sessionId)`.
- Conversation retention is capped (last 20 sent upstream; 7-day expiry; pruning beyond 40 stored messages).

### Payments — `server/src/services/billing.service.js`
- Stripe adapter constructed only when `PAYMENT_PROVIDER=stripe` + key exist; otherwise endpoints return `503 PAYMENTS_NOT_CONFIGURED`.
- Pro access is granted **only** through verified webhook events (`checkout.session.completed`, `customer.subscription.updated/deleted`) with signature verification, then written to `Subscription` + `User.plan`.
- Cancellation calls the provider then mirrors state locally.

### Sandbox preview — `client/src/features/playground/SandboxPreview.jsx`
- User HTML/CSS/JS assembled into a full document rendered inside `<iframe sandbox="allow-scripts">` — crucially **without** `allow-same-origin`, so the guest frame cannot read app storage/cookies.
- Strict CSP (no network except https images/Google Fonts; no `base-uri`, no `form-action`).
- Runtime errors are surfaced to the editor via `postMessage` from inside the sandbox.

### Admin & audit
- All `/api/v1/admin/*` routes require `authenticate` + `authorize()` (role `admin`) — the client guard is cosmetic only.
- Sensitive mutations write `AuditLog` entries (actor, action, target, metadata, ip) via `auditOn` wrappers; metadata select-off by default; never tokens/passwords.

## Frontend conventions
- Zustand stores (`auth`, `ui`); data fetching via `services/api.js` with single-flight refresh retry.
- Route-level `lazy()` everywhere; route guard `RequireAuth` / `RequireAdmin`.
- Visualizers are pure React: sliders/selects → state → inline styles + generated CSS string. No DB reads per interaction (explicit saves only).
- Accessible primitives: labeled inputs, `aria-pressed/current/label`, escape-to-close modals, focus-visible rings, `prefers-reduced-motion` honored globally.
