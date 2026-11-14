import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function RequireAuth({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/login" replace state={{ from }} />;
  }

  return children;
}
