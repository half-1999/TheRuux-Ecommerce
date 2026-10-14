import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';
import { Notice, PageHeader, TableState, Thumb } from '../../components/admin/AdminUI';
import { fmtDate, fmtInr } from '../../components/admin/adminFormat';

function Metric({ label, value, sub, to, loading }) {
  const body = (
    <>
      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-value">{loading ? '…' : value}</div>
      {sub ? <div className="admin-metric-sub">{sub}</div> : null}
    </>
  );
  return to ? (
    <Link to={to} className="admin-card">
      {body}
    </Link>
  ) : (
    <div className="admin-card">{body}</div>
  );
}

function Bars({ rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="admin-muted">Nothing yet.</p>;
  return (
    <div style={{ display: 'grid', gap: '0.55rem' }}>
      {rows.map((row) => (
        <div key={row.status}>
          <div className="admin-split" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
            <span>{label(row.status)}</span>
            <span className="admin-muted">{row.count}</span>
          </div>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const orders = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => adminApi.orders({ pageSize: 8 }),
    staleTime: 0,
  });

  const series = data?.series || [];
  const maxOrders = Math.max(1, ...series.map((day) => day.orders));
  const c = data?.catalog;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live numbers from the store database. Revenue counts verified payments only."
        actions={
          <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
            <Plus size={14} /> Create New Product
          </Link>
        }
      />

      <Notice tone="error">{error?.message}</Notice>

      <div className="admin-grid-metrics">
        <Metric loading={isLoading} label="Paid revenue · 30 days" value={fmtInr(data?.paidRevenue30d)} sub={`All time ${fmtInr(data?.paidRevenue)}`} to="/admin/payments" />
        <Metric loading={isLoading} label="Orders today" value={data?.ordersToday ?? '—'} sub={`Booked ${fmtInr(data?.revenueToday)}`} to="/admin/orders" />
        <Metric loading={isLoading} label="Open orders" value={data?.unfulfilledOrders ?? '—'} sub={`${data?.ordersTotal ?? 0} orders total`} to="/admin/orders" />
        <Metric loading={isLoading} label="Customers" value={data?.customers ?? '—'} sub={`+${data?.newCustomers7d ?? 0} in 7 days`} to="/admin/customers" />
        <Metric
          loading={isLoading}
          label="Products"
          value={c ? c.active + c.draft + c.archived : '—'}
          sub={c ? `${c.active} active · ${c.draft} draft` : ''}
          to="/admin/products"
        />
        <Metric loading={isLoading} label="Categories · collections" value={c ? `${c.categories} · ${c.collections}` : '—'} sub="Active on the store" to="/admin/categories" />
        <Metric
          loading={isLoading}
          label="Stock alerts"
          value={data ? data.lowStockVariants : '—'}
          sub={data ? `${data.outOfStockVariants} variants sold out` : ''}
          to="/admin/inventory"
        />
      </div>

      <div className="admin-row">
        <div className="admin-card">
          <h2>Orders · last 14 days</h2>
          <div className="admin-chart" aria-label="Orders by day">
            {series.map((day) => (
              <div key={day.date} className="admin-chart-col" title={`${day.label}: ${day.orders} orders · ${fmtInr(day.revenue)}`}>
                <div className="admin-chart-bar" style={{ height: `${Math.max(3, (day.orders / maxOrders) * 100)}%` }} />
                <span className="admin-chart-label">{day.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h2>Order status</h2>
          <Bars rows={data?.statusCounts || []} label={orderStatusLabel} />
        </div>
        <div className="admin-card">
          <h2>Payment status</h2>
          <Bars rows={data?.paymentStatusCounts || []} label={paymentStatusLabel} />
        </div>
      </div>

      <div className="admin-row" style={{ marginTop: '0.75rem' }}>
        <div className="admin-card">
          <h2>Low stock</h2>
          {(data?.lowStock || []).map((row) => (
            <div key={row.id} className="admin-split">
              <span>
                {row.productName} <span className="admin-muted">· {row.size}/{row.colourName}</span>
              </span>
              <span className={`admin-badge ${row.stockQty <= 0 ? 'danger' : 'warn'}`}>{row.stockQty}</span>
            </div>
          ))}
          {!isLoading && !data?.lowStock?.length ? <p className="admin-muted">All variants are above the threshold.</p> : null}
          <Link to="/admin/inventory" className="admin-btn admin-btn-sm" style={{ marginTop: '0.85rem' }}>
            Open inventory
          </Link>
        </div>
        <div className="admin-card">
          <h2>Top products</h2>
          {(data?.topProducts || []).map((p) => (
            <div key={p.name} className="admin-split">
              <span>{p.name}</span>
              <span className="admin-muted">
                {p.qty} sold · {fmtInr(p.revenue)}
              </span>
            </div>
          ))}
          {!isLoading && !data?.topProducts?.length ? <p className="admin-muted">No sales yet.</p> : null}
        </div>
        <div className="admin-card">
          <h2>Recent product activity</h2>
          {(data?.recentProducts || []).map((p) => (
            <Link key={p.id} to={`/admin/products/${p.id}`} className="admin-piece">
              <Thumb src={p.image?.url} size="sm" />
              <div style={{ minWidth: 0 }}>
                <strong>{p.name}</strong> <span className="admin-muted">{p.title}</span>
                <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                  {p.isNew ? 'Created' : 'Updated'} {fmtDate(p.updatedAt)} · {p.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-split" style={{ alignItems: 'center', marginTop: '1.75rem', marginBottom: '0.75rem' }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>
          Recent orders
        </h2>
        <Link to="/admin/orders" className="admin-btn admin-btn-sm">
          View Orders
        </Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              colSpan={5}
              loading={orders.isLoading}
              error={orders.error}
              empty={!orders.data?.items?.length}
              emptyText="No orders yet."
            />
            {(orders.data?.items || []).map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/admin/orders/${o.id}`} className="admin-mono">
                    {o.orderNumber}
                  </Link>
                  <div className="admin-muted">{fmtDate(o.placedAt)}</div>
                </td>
                <td>
                  {o.customerName || '—'}
                  <div className="admin-muted">{o.email}</div>
                </td>
                <td>
                  <span className="admin-badge">{orderStatusLabel(o.status)}</span>
                </td>
                <td>
                  <span className={`admin-badge ${o.paymentStatus === 'PAID' ? 'ok' : o.paymentStatus === 'FAILED' ? 'danger' : 'warn'}`}>
                    {paymentStatusLabel(o.paymentStatus)}
                  </span>
                </td>
                <td>{fmtInr(o.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
