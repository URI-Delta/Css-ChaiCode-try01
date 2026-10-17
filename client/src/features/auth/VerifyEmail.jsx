import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMessage } from '../../services/api.js';
import AuthCard from './AuthCard.jsx';
import Button from '../../components/common/Button.jsx';
import { Spinner } from '../../components/common/ui.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ loading: Boolean(token), ok: false, error: null });

  useEffect(() => {
    if (!token) return;
    setState({ loading: true, ok: false, error: null });
    api
      .post('/api/v1/auth/verify-email', { token })
      .then(() => setState({ loading: false, ok: true, error: null }))
      .catch((err) => setState({ loading: false, ok: false, error: errMessage(err) }));
  }, [token]);

  return (
    <AuthCard title="Email verification">
      {state.loading ? (
        <Spinner />
      ) : state.ok ? (
        <div className="grid gap-3 text-sm">
          <p className="text-success">Your email is verified. 🎉</p>
          <Button onClick={() => (window.location.href = '/dashboard')}>Go to dashboard</Button>
        </div>
      ) : (
        <div className="grid gap-3 text-sm">
          <p className="text-error">{state.error || (token ? 'Invalid token.' : 'No verification token in the URL.')}</p>
          <p className="text-muted">Open the exact link from your email, or request a new verification email from Settings → Profile.</p>
          <Link to="/dashboard" className="text-brand hover:underline">
            ← Dashboard
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
