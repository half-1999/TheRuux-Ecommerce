import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { ORDER_STATUS_LABEL, orderStatusLabel } from '../../lib/orderStatus';

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminApi.order(id),
  });
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const transition = useMutation({
    mutationFn: (body) => adminApi.transitionOrder(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p className="admin-error">{error?.message || 'Not found'}</p>;

  return (
    <>
      <div className="admin-topbar">
        <h1>{data.orderNumber}</h1>
        <Link to="/admin/orders" className="admin-btn">
          Back
        </Link>
      </div>
      <div className="admin-row">
        <div className="admin-card">
          <p>
            <span className="admin-badge">{orderStatusLabel(data.status)}</span>{' '}
            <span className={`admin-badge ${data.paymentStatus === 'PAID' ? 'ok' : ''}`}>
              {data.paymentStatus}
            </span>
          </p>
          <p className="admin-muted" style={{ marginTop: '0.75rem' }}>
            {data.email} · {data.phone}
          </p>
          <p className="admin-muted" style={{ marginTop: '0.5rem' }}>
            Payment: {data.paymentMethod || '—'} · {data.paymentStatus}
            <br />
            Shipping: {data.shippingMethodId || '—'} · ₹{Number(data.shipping || 0).toFixed(2)}
            <br />
            Placed: {data.placedAt ? new Date(data.placedAt).toLocaleString() : '—'}
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Total ₹{Number(data.grandTotal).toFixed(2)} · Subtotal ₹{Number(data.subtotal).toFixed(2)}
          </p>
          <p className="admin-muted" style={{ marginTop: '0.75rem' }}>
            {data.shippingAddress?.fullName}
            <br />
            {data.shippingAddress?.line1}
            <br />
            {data.shippingAddress?.city}, {data.shippingAddress?.state}{' '}
            {data.shippingAddress?.postalCode}
          </p>
        </div>
        <div className="admin-card">
          <p className="admin-metric-label">Order status</p>
          <div className="admin-field" style={{ marginTop: '0.75rem' }}>
            <label>Change status</label>
            <select
              value={data.status}
              disabled={transition.isPending}
              onChange={(event) => {
                const toStatus = event.target.value;
                if (!toStatus || toStatus === data.status) return;
                transition.mutate({
                  toStatus,
                  trackingNumber: trackingNumber || undefined,
                  carrier: carrier || undefined,
                });
              }}
            >
              {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <p className="admin-muted">Pending orders can be marked Completed, Shipped, or Cancelled.</p>
          <div className="admin-field">
            <label>Tracking</label>
            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Carrier</label>
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </div>
          {transition.error ? <p className="admin-error">{transition.error.message}</p> : null}
          {transition.isSuccess ? <p className="admin-muted">Status saved. Inventory updated.</p> : null}
        </div>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Variant</th>
              <th>Stock left</th>
              <th>Qty</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((item) => (
              <tr key={item._id || item.sku}>
                <td className="admin-mono">{item.sku}</td>
                <td>
                  {item.productName} — {item.productTitle}
                </td>
                <td>
                  {item.size || '—'} / {item.colourName || '—'}
                  <span className="admin-muted"> · {item.sku}</span>
                </td>
                <td>{item.stockQty == null ? '—' : item.stockQty}</td>
                <td>{item.quantity}</td>
                <td>₹{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
