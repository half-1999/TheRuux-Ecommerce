import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { ORDER_STATUS_LABEL } from '../../lib/orderStatus';

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const changeStatus = useMutation({
    mutationFn: ({ id, toStatus }) => adminApi.transitionOrder(id, { toStatus }),
    onSuccess: () => {
      setMsg('Order status updated.');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err) => setMsg(err.message),
  });
  const { data, isLoading, error } = useQuery({
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
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {msg ? <p className="admin-muted">{msg}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Shipping</th>
              <th>Total</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8}>Loading…</td>
              </tr>
            ) : null}
            {error ? (
              <tr>
                <td colSpan={8} className="admin-error">
                  {error.message}
                </td>
              </tr>
            ) : null}
            {(data?.items || []).map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/admin/orders/${o.id}`} className="admin-mono">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>
                  {o.email}
                  {o.phone ? <span className="admin-muted"> · {o.phone}</span> : null}
                </td>
                <td>{(o.products || []).join(', ') || '—'}</td>
                <td>
                  <select
                    value={o.status}
                    disabled={changeStatus.isPending}
                    onChange={(event) => {
                      const toStatus = event.target.value;
                      if (toStatus === o.status) return;
                      changeStatus.mutate({ id: o.id, toStatus });
                    }}
                  >
                    {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`admin-badge ${o.paymentStatus === 'PAID' ? 'ok' : ''}`}>
                    {o.paymentMethod || o.paymentStatus}
                  </span>
                </td>
                <td className="admin-muted">{o.shippingMethodId || '—'}</td>
                <td>₹{o.grandTotal}</td>
                <td className="admin-muted">{o.placedAt ? new Date(o.placedAt).toLocaleString() : ''}</td>
              </tr>
            ))}
            {!isLoading && !error && !data?.items?.length ? (
              <tr>
                <td colSpan={8} className="admin-muted">
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
