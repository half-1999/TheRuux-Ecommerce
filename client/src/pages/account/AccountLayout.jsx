import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

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

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-[var(--space-header-x)] pt-50 h-screen pb-24">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-3 text-[var(--color-text-muted)]">Sign in to view orders and details.</p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/auth/login"
            className="inline-flex min-h-11 items-center px-5 text-sm text-[#000000] border border-[#5F6F64]/40 hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"  
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex min-h-11 items-center px-5 text-sm text-[#000000] border border-[#5F6F64]/40 hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pt-50 h-screen">
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
