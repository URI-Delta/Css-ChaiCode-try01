import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard, AlertTriangle, History } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ConfirmDialog } from '../../components/common/ui.jsx';

export default function Billing() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [params] = useSearchParams();
  const toast = useUIStore((s) => s.toast);

  /* surface checkout result from Stripe redirect */
  useEffect(() => {
    const checkout = params.get('checkout');
    if (checkout === 'success') toast('Payment received — Pro activates once the provider confirms (usually seconds).', 'success', 8000);
    if (checkout === 'cancelled') toast('Checkout cancelled — nothing was charged.', 'info');
  }, [params, toast]);

  const load = () => api.get('/api/v1/billing/subscription').then(({ data }) => setData(data)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const upgrade = async () => {
    setLoadingCheckout(true);
    try {
      const res = await api.post('/api/v1/billing/checkout');
      if (res.data.url) window.location.assign(res.data.url);
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const cancel = async () => {
    setCancelOpen(false);
    try {
      await api.post('/api/v1/billing/cancel');
      toast('Subscription cancelled. Pro access has ended.', 'info');
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <EmptyState icon="⚠️" title="Billing unavailable" description={error} />;
  if (!data) return <div className="mx-auto max-w-2xl"><Skeleton className="h-64" /></div>;

  const active = data.plan === 'pro';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Billing</h1>

      {!data.payments?.configured && (
        <Card className="mt-5 !border-pro/40">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-pro" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold">Payments not configured on this deployment</p>
              <p className="mt-1 text-muted">
                The server's <code className="font-mono text-xs">PAYMENT_PROVIDER</code> and credentials are unset. Checkout is disabled here — there is no simulated payment flow on purpose. Operators: see <code className="font-mono text-xs">.env.example</code>.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-5">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-brand" aria-hidden />
          <span className="font-semibold">{active ? 'Pro subscription' : 'Free plan'}</span>
          <Badge tone={active ? 'pro' : 'default'} className="ml-auto">{data.subscription?.status || data.plan}</Badge>
        </div>

        {data.subscription && (
          <div className="mt-4 grid gap-1 text-sm text-muted">
            <div>Provider: <span className="font-mono text-xs text-text">{data.subscription.provider}</span></div>
            {data.subscription.currentPeriodEnd && (
              <div>Renews / ends: {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</div>
            )}
            {data.subscription.history?.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"><History size={12} /> History</div>
                <ul className="mt-1.5 grid gap-1 text-xs">
                  {data.subscription.history.slice(-6).reverse().map((h, i) => (
                    <li key={i} className="font-mono">{new Date(h.at).toLocaleDateString()} — {h.event} {h.note ? `(${h.note})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {!active && data.payments?.configured && (
            <Button variant="pro" onClick={upgrade} loading={loadingCheckout}>Upgrade to Pro</Button>
          )}
          {!active && !data.payments?.configured && (
            <Link to="/pricing" className="btn btn-secondary">Compare plans</Link>
          )}
          {active && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel subscription</Button>}
        </div>
      </Card>

      <p className="mt-4 text-xs text-muted">Entitlements are enforced on the server from provider webhook events — never from redirects alone.</p>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Pro subscription?"
        body="You'll keep Pro access until the current period ends (if the provider reports one), then drop to Free. This action cancels billing with the provider."
        confirmLabel="Cancel subscription"
        danger
        onConfirm={cancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
