import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function RequireAuth({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const markReady = () => setReady(true);
    const unsub = useAuthStore.persist.onFinishHydration(markReady);
    if (useAuthStore.persist.hasHydrated()) window.queueMicrotask(markReady);
    return unsub;
  }, []);

  if (!ready) return null;

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/login" replace state={{ from }} />;
  }

  return children;
}
