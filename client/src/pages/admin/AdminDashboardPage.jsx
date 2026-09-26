import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client';

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
  });
  const orders = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => adminApi.orders({}),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Dashboard</h1>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          New product
        </Link>
      </div>

      {error ? <p className="admin-error">{error.message}</p> : null}

      <div className="admin-grid-metrics">
        {[
          ['Orders today', data?.ordersToday ?? '—'],
          ['Revenue today', data?.revenueToday != null ? `₹${data.revenueToday}` : '—'],
          ['Unfulfilled', data?.unfulfilledOrders ?? '—'],
          ['Low stock', data?.lowStockVariants ?? '—'],
          ['New customers 7d', data?.newCustomers7d ?? '—'],
        ].map(([label, value]) => (
          <div key={label} className="admin-card">
            <div className="admin-metric-label">{label}</div>
            <div className="admin-metric-value">{isLoading ? '…' : value}</div>
          </div>
        ))}
      </div>

      <div className="admin-topbar" style={{ marginTop: '1.25rem' }}>
        <h1 style={{ fontSize: '1rem' }}>Recent orders</h1>
        <Link to="/admin/orders" className="admin-btn">
          View all
        </Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Email</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(orders.data?.items || []).slice(0, 8).map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/admin/orders/${o.id}`} className="admin-mono">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{o.email}</td>
                <td>
                  <span className="admin-badge">{o.status}</span>
                </td>
                <td>
                  <span className={`admin-badge ${o.paymentStatus === 'PAID' ? 'ok' : ''}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td>₹{o.grandTotal}</td>
              </tr>
            ))}
            {!orders.isLoading && !orders.data?.items?.length ? (
              <tr>
                <td colSpan={5} className="admin-muted">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
