import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api, { errMessage } from '../../services/api.js';
import AuthCard, { FormError } from './AuthCard.jsx';
import { Input } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/v1/auth/forgot-password', values);
      setSent(true);
      if (data?.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Recover your password"
      subtitle="We'll email you a reset link. It expires in one hour and can be used once."
      footer={
        <Link to="/login" className="hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="grid gap-3 text-sm">
          <p className="text-success">If that email is registered, a reset link is on its way.</p>
          {devToken && (
            <p className="text-muted">
              SMTP not configured on this deployment — open the link directly:{' '}
              <Link to={`/reset-password/${devToken}`} className="text-brand hover:underline">
                reset your password →
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" noValidate>
          <FormError message={error} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
