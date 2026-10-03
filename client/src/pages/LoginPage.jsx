import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const location = useLocation();
  const next = safeReturn(location.state?.from);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      push({ title: 'Welcome back.' });
      navigate(next || '/account', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-[var(--space-header-x)] pt-56 h-screen">
      <h1 className="text-3xl font-semibold">Sign in</h1>
      {next.startsWith('/checkout') ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Sign in to continue to checkout.</p>
      ) : null}
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        New here?{' '}
        <Link to="/auth/register" state={location.state} className="underline underline-offset-4">
          Create an account
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-6">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}

function safeReturn(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return '';
  return path;
}
