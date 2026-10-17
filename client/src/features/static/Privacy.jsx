export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Privacy policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-text">What we store</h2>
          <p className="mt-1.5">An account is an email, a name, a bcrypt password hash and your learning data: lesson progress, challenge attempts, saved projects and preferences. We do not store payment card data — that stays with the payment provider.</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">Cookies</h2>
          <p className="mt-1.5">Authentication uses two HttpOnly cookies: a short-lived access token and a rotating refresh token. They cannot be read by JavaScript and are never used for tracking.</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">AI tutor</h2>
          <p className="mt-1.5">When the tutor is configured, your messages are sent to the configured AI provider to generate answers. Conversations are kept for 7 days, then deleted automatically. Usage is logged in aggregate for quota and abuse prevention.</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">Deleting your data</h2>
          <p className="mt-1.5">Email support to request account deletion. Saved projects and progress are removed with the account.</p>
        </section>
      </div>
    </div>
  );
}
