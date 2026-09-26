import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

const NEXT = {
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
};

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminApi.order(id),
  });
  const [toStatus, setToStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const transition = useMutation({
    mutationFn: () =>
      adminApi.transitionOrder(id, {
        toStatus,
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p className="admin-error">{error?.message || 'Not found'}</p>;

  const options = NEXT[data.status] || [];

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
            <span className="admin-badge">{data.status}</span>{' '}
            <span className={`admin-badge ${data.paymentStatus === 'PAID' ? 'ok' : ''}`}>
              {data.paymentStatus}
            </span>
          </p>
          <p className="admin-muted" style={{ marginTop: '0.75rem' }}>
            {data.email} · {data.phone}
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
          <p className="admin-metric-label">Transition</p>
          {options.length ? (
            <>
              <div className="admin-field">
                <label>To status</label>
                <select value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
                  <option value="">Select…</option>
                  {options.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>Tracking</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </div>
              <div className="admin-field">
                <label>Carrier</label>
                <input value={carrier} onChange={(e) => setCarrier(e.target.value)} />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={!toStatus || transition.isPending}
                onClick={() => transition.mutate()}
              >
                Update status
              </button>
              {transition.error ? <p className="admin-error">{transition.error.message}</p> : null}
            </>
          ) : (
            <p className="admin-muted">No further transitions from {data.status}.</p>
          )}
        </div>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((item) => (
              <tr key={item._id || item.sku}>
                <td className="admin-mono">{item.sku}</td>
                <td>
                  {item.productName} — {item.productTitle} ({item.size}/{item.colourName})
                </td>
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
