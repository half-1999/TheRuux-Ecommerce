import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowSquareOut, CaretDoubleLeft, CaretDoubleRight, List, SignOut, X } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { ScrollToTop } from '../layout/ScrollToTop';
import { DEFAULT_NAV, NAV_ICONS, groupNav } from './adminNav';
import '../../styles/admin.css';

const COLLAPSE_KEY = 'theruux_admin_sidebar';

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  // Drawer remembers the path it opened on, so navigating closes it without an effect.
  const [drawerPath, setDrawerPath] = useState(null);
  const drawerOpen = drawerPath === location.pathname;
  const setDrawerOpen = (open) => setDrawerPath(open ? location.pathname : null);

  const nav = useQuery({ queryKey: ['admin-navigation'], queryFn: adminApi.navigation, staleTime: 60_000 });
  const items = (nav.data?.items || DEFAULT_NAV).filter((item) => item.enabled);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerPath(null);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="admin-root">
      <ScrollToTop />
      <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
        <header className="admin-mobilebar">
          <button type="button" className="admin-icon-btn" aria-label="Open navigation" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
            <List size={20} />
          </button>
          <img src="/brand/logo.png" alt="TheRuux" className="admin-logo" />
          <span className="admin-mobilebar-spacer" />
        </header>

        {drawerOpen ? <div className="admin-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden /> : null}

        <aside className={`admin-sidebar ${drawerOpen ? 'is-open' : ''}`} aria-label="Admin sidebar">
          <div className="admin-brand">
            <img src="/brand/logo.png" alt="TheRuux" className="admin-logo" />
            <span className="admin-brand-tag">Studio</span>
            <button type="button" className="admin-icon-btn admin-drawer-close" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav className="admin-nav" aria-label="Admin">
            {groupNav(items).map((group, gi) => (
              <div key={`${group.name}-${gi}`} className="admin-nav-group">
                {group.name ? <p className="admin-nav-heading">{group.name}</p> : null}
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon] || NAV_ICONS.star;
                  return (
                    <NavLink key={item.id} to={item.to} end={item.to === '/admin'} data-tip={item.label} title={collapsed ? item.label : undefined}>
                      <Icon size={18} weight="regular" aria-hidden />
                      <span className="admin-nav-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-foot">
            <a href="/" className="admin-nav-link" data-tip="Storefront" title={collapsed ? 'Storefront' : undefined}>
              <ArrowSquareOut size={18} aria-hidden />
              <span className="admin-nav-label">Storefront</span>
            </a>
            <button
              type="button"
              className="admin-nav-link"
              data-tip="Log out"
              title={collapsed ? 'Log out' : undefined}
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
            >
              <SignOut size={18} aria-hidden />
              <span className="admin-nav-label">Log out</span>
            </button>
            <p className="admin-nav-label admin-muted admin-user">{user?.email}</p>
            <button
              type="button"
              className="admin-collapse"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <CaretDoubleRight size={16} /> : <CaretDoubleLeft size={16} />}
              <span className="admin-nav-label">Collapse</span>
            </button>
          </div>
        </aside>

        <main className="admin-main" id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
