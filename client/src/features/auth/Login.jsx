import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormError } from './AuthCard.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { Input } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch {
      /* error surfaced via store */
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue learning."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="text-brand hover:underline">
            Create one free
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" noValidate>
        <FormError message={error} />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
        <Link to="/forgot-password" className="text-center text-xs text-muted hover:text-text">
          Forgot your password?
        </Link>
      </form>
    </AuthCard>
  );
}
