import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ScrollToTop } from '../layout/ScrollToTop';
import '../../styles/admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/collections', label: 'Collections' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/homepage', label: 'Homepage CMS' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="admin-root">
      <ScrollToTop />
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <img src="/brand/logo.png" alt="TheRuux" />
            <span>Ops</span>
          </div>
          <nav className="admin-nav" aria-label="Admin">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', padding: '0.75rem 0.65rem' }}>
            <p className="admin-muted" style={{ marginBottom: '0.5rem' }}>
              {user?.email}
            </p>
            <button
              type="button"
              className="admin-btn"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
            >
              Log out
            </button>
            <a href="/" className="admin-muted" style={{ display: 'block', marginTop: '0.75rem' }}>
              ← Storefront
            </a>
          </div>
        </aside>
        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
