export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Terms of service</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-text">Your account</h2>
          <p className="mt-1.5">Keep your credentials safe. You're responsible for activity under your account. We may suspend accounts that abuse the platform (rate-limit evasion, malware, harassment).</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">Subscriptions</h2>
          <p className="mt-1.5">Paid plans renew per their billing interval until cancelled through the billing page or provider. Prices, plans and features are configurable by the operator and can change with notice. Access to Pro content requires an active status determined by provider webhooks, never by client state.</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">Your content</h2>
          <p className="mt-1.5">Code you write in the playground is yours. Shared links are read-only but public — don't share anything sensitive. Don't upload malware or anything illegal.</p>
        </section>
        <section>
          <h2 className="font-semibold text-text">This is a service, not a guarantee</h2>
          <p className="mt-1.5">We aim for high availability but the service is provided as-is, without warranty. Liability is limited to the amount you paid in the last billing period.</p>
        </section>
      </div>
    </div>
  );
}
