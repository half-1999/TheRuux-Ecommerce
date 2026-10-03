import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { orderStatusLabel } from '../../lib/orderStatus';

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const orders = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => adminApi.orders({}),
    staleTime: 0,
  });

  const series = data?.series || [];
  const maxOrders = Math.max(1, ...series.map((day) => day.orders));
  const statusCounts = data?.statusCounts || [];
  const maxStatus = Math.max(1, ...statusCounts.map((row) => row.count));

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
          ['Open orders', data?.unfulfilledOrders ?? '—'],
          ['Low stock', data?.lowStockVariants ?? '—'],
          ['Customers', data?.customers ?? '—'],
          ['New customers 7d', data?.newCustomers7d ?? '—'],
          ['Active products', data?.activeProducts ?? '—'],
        ].map(([label, value]) => (
          <div key={label} className="admin-card">
            <div className="admin-metric-label">{label}</div>
            <div className="admin-metric-value">{isLoading ? '…' : value}</div>
          </div>
        ))}
      </div>

      <div className="admin-row">
        <div className="admin-card">
          <p className="admin-metric-label">Orders · last 14 days</p>
          <div className="admin-chart" aria-label="Orders by day">
            {series.map((day) => (
              <div key={day.date} className="admin-chart-col" title={`${day.label}: ${day.orders} orders · ₹${day.revenue}`}>
                <div
                  className="admin-chart-bar"
                  style={{ height: `${Math.max(4, (day.orders / maxOrders) * 100)}%` }}
                />
                <span className="admin-chart-label">{day.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <p className="admin-metric-label">Orders by status</p>
          <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.45rem' }}>
            {statusCounts.length ? (
              statusCounts.map((row) => (
                <div key={row.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>{orderStatusLabel(row.status)}</span>
                    <span className="admin-muted">{row.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--admin-bg)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(row.count / maxStatus) * 100}%`,
                        background: 'var(--admin-ok)',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-muted">{isLoading ? 'Loading…' : 'No orders yet.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="admin-row" style={{ marginTop: '0.75rem' }}>
        <div className="admin-card">
          <p className="admin-metric-label">Top products</p>
          <table className="admin-table" style={{ marginTop: '0.75rem' }}>
            <tbody>
              {(data?.topProducts || []).map((product) => (
                <tr key={product.name}>
                  <td>{product.name}</td>
                  <td>{product.qty} sold</td>
                  <td>₹{product.revenue}</td>
                </tr>
              ))}
              {!isLoading && !data?.topProducts?.length ? (
                <tr>
                  <td className="admin-muted">No sales yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="admin-card">
          <p className="admin-metric-label">Low stock</p>
          <table className="admin-table" style={{ marginTop: '0.75rem' }}>
            <tbody>
              {(data?.lowStock || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.productName} · {row.size}/{row.colourName}
                  </td>
                  <td className="admin-mono">{row.sku}</td>
                  <td>
                    <span className="admin-badge warn">{row.stockQty}</span>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.lowStock?.length ? (
                <tr>
                  <td className="admin-muted">No low-stock variants.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Link to="/admin/inventory" className="admin-btn" style={{ marginTop: '0.75rem' }}>
            Inventory
          </Link>
        </div>
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
                  <span className="admin-badge">{orderStatusLabel(o.status)}</span>
                </td>
                <td>
                  <span className={`admin-badge ${o.paymentStatus === 'PAID' ? 'ok' : ''}`}>
                    {o.paymentMethod || o.paymentStatus}
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
