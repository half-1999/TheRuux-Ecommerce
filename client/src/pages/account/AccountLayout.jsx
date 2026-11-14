import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoginPage } from '../LoginPage';

const LINKS = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/details', label: 'Account Details' },
  { to: '/account/addresses', label: 'Addresses' },
];

export function AccountLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();

  if (!user && pathname.startsWith('/account/wishlist')) {
    return (
      <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-50">
        <h1 className="text-3xl font-semibold">Wishlist</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Saved on this device until you sign in.</p>
        <div className="mt-10">
          <Outlet />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-50">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Hello, {user.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>
        </div>
        <button type="button" onClick={() => logout()} className="text-sm underline">
          Log out
        </button>
      </div>
      <nav className="mt-8 flex gap-4 overflow-x-auto border-b border-[var(--color-border)] pb-3 text-sm">
        {LINKS.map((link) => {
          const active = link.end ? pathname === link.to : pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={
                active
                  ? 'font-medium text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10">
        <Outlet />
      </div>
    </div>
  );
}
