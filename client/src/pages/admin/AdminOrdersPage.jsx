import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, q],
    queryFn: () =>
      adminApi.orders({
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
      }),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Orders</h1>
      </div>
      <div className="admin-toolbar">
        <input placeholder="Order number" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
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
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : null}
            {(data?.items || []).map((o) => (
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
                <td className="admin-muted">{o.placedAt ? new Date(o.placedAt).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
