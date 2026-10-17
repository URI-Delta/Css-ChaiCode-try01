import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormError } from './AuthCard.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { Input } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = await registerUser(values.name, values.email, values.password);
      if (data?.devVerifyToken) setDevToken(data.devVerifyToken);
      else navigate('/dashboard', { replace: true });
    } catch {
      /* error surfaced via store */
    } finally {
      setLoading(false);
    }
  };

  if (devToken) {
    return (
      <AuthCard title="Check your email" subtitle="We sent a verification link. (No SMTP configured on this deployment — here's your link directly.)">
        <Link to={`/verify-email?token=${devToken}`} className="text-brand hover:underline" onClick={() => navigate('/dashboard')}>
          Verify your email now →
        </Link>
        <div className="mt-4">
          <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free plan. No credit card. Always."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" noValidate>
        <FormError message={error} />
        <Input label="Name" autoComplete="name" placeholder="Ada Lovelace" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="8+ chars, 1 uppercase, 1 number" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <p className="text-[11px] text-muted">By creating an account you agree to our <Link to="/terms" className="underline">terms</Link>.</p>
        <Button type="submit" loading={loading}>
          Start Learning CSS — Free
        </Button>
      </form>
    </AuthCard>
  );
}
