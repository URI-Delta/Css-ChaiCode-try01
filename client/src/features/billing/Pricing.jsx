import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';

export default function Pricing() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);

  useEffect(() => {
    api.get('/api/v1/billing/plans').then(({ data }) => setPlans(data.plans)).catch((err) => setError(errMessage(err)));
  }, []);

  const startUpgrade = async () => {
    try {
      const { data } = await api.post('/api/v1/billing/checkout');
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <EmptyState icon="⚠️" title="Pricing unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold tracking-tight">Simple pricing</h1>
      <p className="mt-2 text-center text-sm text-muted">Learn free forever. Upgrade only when you want everything.</p>

      {!plans && <div className="mt-10 grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-80" />)}</div>}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {plans?.map((p) => (
          <Card key={p.id} className={`flex flex-col ${p.name === 'pro' ? 'border-pro/60 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{p.title}</h2>
              {p.name === 'pro' && <Badge tone="pro">Most popular</Badge>}
            </div>
            <div className="mt-2">
              <span className="text-4xl font-bold">{p.currency === 'USD' ? '$' : ''}{p.price}</span>
              <span className="text-sm text-muted">/{p.billingInterval === 'lifetime' ? 'once' : p.billingInterval}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{p.description}</p>
            <ul className="mt-4 grid flex-1 content-start gap-2 text-sm">
              {(p.features || []).map((f, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {p.name === 'free' ? (
                <Link to={user ? '/learn' : '/register'} className="btn btn-secondary w-full">
                  {user ? 'Start learning' : 'Create free account'} <ArrowRight size={15} />
                </Link>
              ) : user ? (
                user.plan === 'pro' ? (
                  <Link to="/billing" className="btn btn-pro w-full">Manage subscription</Link>
                ) : (
                  <Button variant="pro" className="w-full" onClick={startUpgrade}>Upgrade to Pro</Button>
                )
              ) : (
                <Link to="/register" className="btn btn-pro w-full">Get Pro</Link>
              )}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted">Prices are configured by the platform owner and may change. Payments are processed by Stripe.</p>
    </div>
  );
}

