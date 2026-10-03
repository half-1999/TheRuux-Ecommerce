import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreLayout } from './components/layout/StoreLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CollectionPage } from './pages/CollectionPage';
import { SearchPage } from './pages/SearchPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { CmsPage, ContactPage } from './pages/CmsPage';
import { AccountLayout } from './pages/account/AccountLayout';
import { AccountOverview } from './pages/account/AccountOverview';
import { OrdersPage } from './pages/account/OrdersPage';
import { OrderDetailPage } from './pages/account/OrderDetailPage';
import { WishlistPage } from './pages/account/WishlistPage';
import { AccountDetailsPage } from './pages/account/AccountDetailsPage';
import { AddressesPage } from './pages/account/AddressesPage';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { RequireAuth } from './components/auth/RequireAuth';

const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
);
const AdminProductEditPage = lazy(() =>
  import('./pages/admin/AdminProductEditPage').then((m) => ({ default: m.AdminProductEditPage })),
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })),
);
const AdminCollectionsPage = lazy(() =>
  import('./pages/admin/AdminCollectionsPage').then((m) => ({ default: m.AdminCollectionsPage })),
);
const AdminInventoryPage = lazy(() =>
  import('./pages/admin/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })),
);
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
);
const AdminOrderDetailPage = lazy(() =>
  import('./pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })),
);
const AdminCustomersPage = lazy(() =>
  import('./pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })),
);
const AdminCustomerDetailPage = lazy(() =>
  import('./pages/admin/AdminCustomerDetailPage').then((m) => ({ default: m.AdminCustomerDetailPage })),
);
const AdminHomepagePage = lazy(() =>
  import('./pages/admin/AdminHomepagePage').then((m) => ({ default: m.AdminHomepagePage })),
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
);

function AdminFallback() {
  return (
    <div className="admin-root" style={{ padding: '2rem' }}>
      Loading ops…
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Suspense fallback={<AdminFallback />}>
        <Routes location={location}>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/:id" element={<AdminProductEditPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="collections" element={<AdminCollectionsPage />} />
              <Route path="inventory" element={<AdminInventoryPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
              <Route path="homepage" element={<AdminHomepagePage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        <Routes location={location}>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage mode="all" />} />
            <Route path="shop/:category" element={<ShopPage mode="category" />} />
            <Route path="new-arrivals" element={<ShopPage mode="new" />} />
            <Route path="bestsellers" element={<ShopPage mode="bestsellers" />} />
            <Route path="collections/:slug" element={<CollectionPage />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
            <Route path="about" element={<CmsPage slug="about-us" title="About Us" />} />
            <Route path="our-story" element={<CmsPage slug="our-story" title="Our Story" />} />
            <Route path="help/:slug" element={<CmsPage />} />
            <Route path="legal/:slug" element={<CmsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountOverview />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="details" element={<AccountDetailsPage />} />
              <Route path="addresses" element={<AddressesPage />} />
            </Route>
            <Route path="auth/login" element={<LoginPage />} />
            <Route path="auth/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
