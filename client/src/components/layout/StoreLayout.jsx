import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { ToastViewport } from '../ui/Toast';
import { CartDrawer } from '../commerce/CartDrawer';
import { SearchOverlay } from '../search/SearchOverlay';
import { useAuthStore } from '../../store/authStore';

export function StoreLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  // Guest checkout used to render an empty main, so the header and footer stacked at the top.
  if (pathname === '/checkout' && !user) return <Outlet />;

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
        <Footer />
      </main>
      <CartDrawer />
      <SearchOverlay />
      <ToastViewport />
    </div>
  );
}
