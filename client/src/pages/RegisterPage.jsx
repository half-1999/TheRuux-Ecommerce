import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password });
      push({ title: 'Account created.' });
      navigate('/account');
    } catch (err) {
      setError(err.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-[var(--space-header-x)] pb-24 pt-28">
      <h1 className="text-3xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Already have one?{' '}
        <Link to="/auth/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </div>
  );
}
