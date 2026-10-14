import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { ORDER_STATUS_LABEL, formatOrderDate, orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';

function badgeClass(status) {
  if (['PAID', 'DELIVERED', 'COMPLETED'].includes(status)) return 'ok';
  if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(status)) return 'danger';
  if (status === 'PENDING_PAYMENT' || status === 'PENDING') return 'warn';
  return '';
}

function money(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
}

function AddressBlock({ address }) {
  if (!address?.line1 && !address?.city) return <p className="admin-muted">No address on this order.</p>;
  return (
    <p>
      {address.fullName ? (
        <>
          <strong>{address.fullName}</strong>
          <br />
        </>
      ) : null}
      {address.phone ? (
        <>
          {address.phone}
          <br />
        </>
      ) : null}
      {address.line1}
      {address.line2 ? (
        <>
          <br />
          {address.line2}
        </>
      ) : null}
      <br />
      {[address.city, address.state].filter(Boolean).join(', ')} {address.postalCode}
      {address.country ? (
        <>
          <br />
          {address.country}
        </>
      ) : null}
    </p>
  );
}

function sameAddress(a, b) {
  if (!a || !b) return false;
  return ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'].every(
    (key) => (a[key] || '') === (b[key] || ''),
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminApi.order(id),
  });
  const [trackingDraft, setTrackingDraft] = useState(null);
  const [carrierDraft, setCarrierDraft] = useState(null);

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

  const trackingNumber = trackingDraft ?? data.trackingNumber ?? '';
  const carrier = carrierDraft ?? data.carrier ?? '';
  const billingDiffers = data.billingAddress && !sameAddress(data.shippingAddress, data.billingAddress);

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>{data.orderNumber}</h1>
          <p className="admin-muted" style={{ margin: '0.35rem 0 0' }}>
            Placed {formatOrderDate(data.placedAt) || '—'}
            {data.paidAt ? ` · Paid ${formatOrderDate(data.paidAt)}` : ''}
            {data.itemCount ? ` · ${data.itemCount} ${data.itemCount === 1 ? 'piece' : 'pieces'}` : ''}
          </p>
        </div>
        <Link to="/admin/orders" className="admin-btn">
          Back
        </Link>
      </div>

      <div className="admin-order-layout">
        <div className="admin-order-stack">
          <div className="admin-card">
            <p className="admin-metric-label">Pieces</p>
            <div style={{ marginTop: '0.85rem' }}>
              {(data.items || []).map((item) => (
                <div key={item.id || item.sku} className="admin-piece">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="admin-thumb lg" />
                  ) : (
                    <div className="admin-thumb lg" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{item.productName}</strong>
                    {item.productTitle ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{item.productTitle}</p> : null}
                    <p className="admin-muted" style={{ margin: '0.25rem 0 0' }}>
                      {[item.colourName, item.size].filter(Boolean).join(' / ') || '—'}
                      {item.sku ? ` · ${item.sku}` : ''}
                      {` · Qty ${item.quantity}`}
                    </p>
                    <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                      {money(item.unitPrice)} each
                      {item.stockQty == null ? '' : ` · ${item.stockQty} left in stock`}
                    </p>
                    {item.personalization?.textFront || item.personalization?.textBack ? (
                      <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                        {item.personalization.textFront ? `Front: ${item.personalization.textFront}` : ''}
                        {item.personalization.textFront && item.personalization.textBack ? ' · ' : ''}
                        {item.personalization.textBack ? `Back: ${item.personalization.textBack}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <strong>{money(item.lineTotal)}</strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.75rem' }}>
              <div className="admin-split">
                <span className="admin-muted">Subtotal</span>
                <span>{money(data.subtotal)}</span>
              </div>
              <div className="admin-split">
                <span className="admin-muted">Shipping</span>
                <span>{Number(data.shipping) ? money(data.shipping) : 'Free'}</span>
              </div>
              {Number(data.tax) ? (
                <div className="admin-split">
                  <span className="admin-muted">Tax</span>
                  <span>{money(data.tax)}</span>
                </div>
              ) : null}
              <div className="admin-split">
                <strong>Total</strong>
                <strong>{money(data.grandTotal)}</strong>
              </div>
            </div>
          </div>

          {data.timeline?.length ? (
            <div className="admin-card">
              <p className="admin-metric-label">Updates</p>
              <ol className="admin-timeline">
                {data.timeline.map((entry, index) => (
                  <li key={`${entry.status}-${entry.at || index}`}>
                    <strong>{orderStatusLabel(entry.status)}</strong>
                    {entry.note ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{entry.note}</p> : null}
                    {entry.at ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{formatOrderDate(entry.at)}</p> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="admin-order-stack">
          <div className="admin-card">
            <p>
              <span className={`admin-badge ${badgeClass(data.status)}`}>{orderStatusLabel(data.status)}</span>{' '}
              <span className={`admin-badge ${badgeClass(data.paymentStatus)}`}>
                Payment {paymentStatusLabel(data.paymentStatus)}
              </span>
            </p>
            {data.statusReason ? <p style={{ marginTop: '0.75rem' }}>{data.statusReason}</p> : null}
            <div className="admin-kv" style={{ marginTop: '1rem' }}>
              <div>
                <p className="admin-metric-label">Customer</p>
                <p>{data.customerName || data.shippingAddress?.fullName || '—'}</p>
                <p className="admin-muted">{data.email}</p>
                <p className="admin-muted">{data.phone || '—'}</p>
              </div>
              <div>
                <p className="admin-metric-label">Shipping address</p>
                <AddressBlock address={data.shippingAddress} />
              </div>
              {billingDiffers ? (
                <div>
                  <p className="admin-metric-label">Billing address</p>
                  <AddressBlock address={data.billingAddress} />
                </div>
              ) : null}
              <div>
                <p className="admin-metric-label">Payment</p>
                <p>
                  {data.paymentLabel || '—'}
                  {data.paymentDetail ? ` · ${data.paymentDetail}` : ''}
                </p>
                <p className="admin-muted">{paymentStatusLabel(data.paymentStatus)}</p>
                {data.paidAt ? <p className="admin-muted">Paid {formatOrderDate(data.paidAt)}</p> : null}
              </div>
              <div>
                <p className="admin-metric-label">Shipping</p>
                <p>
                  {data.shippingLabel || '—'}
                  {data.shippingEstimate ? ` · ${data.shippingEstimate}` : ''}
                </p>
                <p className="admin-muted">{Number(data.shipping) ? money(data.shipping) : 'Free'}</p>
                {data.trackingNumber ? (
                  <p className="admin-mono">
                    {data.carrier ? `${data.carrier} · ` : ''}
                    {data.trackingNumber}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <p className="admin-metric-label">Update order</p>
            <div className="admin-field" style={{ marginTop: '0.75rem' }}>
              <label>Status</label>
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
            <div className="admin-field">
              <label>Tracking</label>
              <input value={trackingNumber} onChange={(e) => setTrackingDraft(e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Carrier</label>
              <input value={carrier} onChange={(e) => setCarrierDraft(e.target.value)} />
            </div>
            {transition.error ? <p className="admin-error">{transition.error.message}</p> : null}
            {transition.isSuccess ? <p className="admin-muted">Status saved. Inventory updated.</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
