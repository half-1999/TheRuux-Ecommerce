import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import '../../styles/admin.css';

export function AdminLoginPage() {
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@theruux.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role === 'admin') {
    return <Navigate to={location.state?.from || '/admin'} replace />;
  }

  return (
    <div className="admin-root admin-login">
      <form
        className="admin-login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setLoading(true);
          try {
            const data = await login({ email, password });
            if (data.user?.role !== 'admin') {
              await useAuthStore.getState().logout();
              setError('Admin access required');
              return;
            }
            navigate(location.state?.from || '/admin', { replace: true });
          } catch (err) {
            setError(err.message || 'Login failed');
          } finally {
            setLoading(false);
          }
        }}
      >
        <img src="/brand/logo.png" alt="TheRuux" style={{ height: 36, filter: 'brightness(0) invert(1)' }} />
        <p className="admin-muted" style={{ marginTop: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Admin console
        </p>
        <div className="admin-field" style={{ marginTop: '1.25rem' }}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="admin-field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
