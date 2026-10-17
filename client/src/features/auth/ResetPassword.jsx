import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api, { errMessage } from '../../services/api.js';
import AuthCard, { FormError } from './AuthCard.jsx';
import { Input } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
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
      await api.post('/api/v1/auth/reset-password', { token, password: values.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" footer={<Link to="/login" className="hover:underline">← Back to sign in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" noValidate>
        <FormError message={error} />
        <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" loading={loading}>
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
