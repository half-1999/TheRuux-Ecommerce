import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { ToastViewport } from '../ui/Toast';
import { CartDrawer } from '../commerce/CartDrawer';
import { SearchOverlay } from '../search/SearchOverlay';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <ToastViewport />
    </div>
  );
}
