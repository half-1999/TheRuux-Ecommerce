import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { ORDER_STATUS_LABEL, formatOrderDate, orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';
import { Notice, PageHeader, Pagination, TableState } from '../../components/admin/AdminUI';
import { useDebounced } from '../../components/admin/adminFormat';

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

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState(null);
  const search = useDebounced(q);
  const changeStatus = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.transitionOrder(id, body),
    onSuccess: (_r, { toStatus }) => {
      setMsg({ tone: 'ok', text: `Order moved to ${orderStatusLabel(toStatus)}.` });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err) => setMsg({ tone: 'error', text: err.message }),
  });
  const params = Object.fromEntries(Object.entries({ status, q: search, from, to, page }).filter(([, v]) => v !== ''));
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => adminApi.orders(params),
    placeholderData: keepPreviousData,
  });
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const onStatus = (order, toStatus) => {
    if (toStatus === order.status) return;
    const body = { id: order.id, toStatus };
    if (toStatus === 'REFUNDED') {
      const note = window.prompt('Refunds are issued in the payment provider dashboard. Enter the provider refund reference:');
      if (!note?.trim()) return;
      body.note = note.trim().slice(0, 500);
    } else if (toStatus === 'CANCELLED' && !window.confirm(`Cancel ${order.orderNumber}? Reserved stock is released.`)) {
      return;
    }
    changeStatus.mutate(body);
  };

  return (
    <>
      <PageHeader crumbs={[{ label: 'Orders' }]} title="Orders" description="Status changes follow the order workflow. Payment status only changes through verified payment events." />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Order number, email or name" value={q} onChange={filter(setQ)} aria-label="Search orders" />
        <input type="date" value={from} onChange={filter(setFrom)} aria-label="Placed from" />
        <input type="date" value={to} onChange={filter(setTo)} aria-label="Placed to" />
        <select value={status} onChange={filter(setStatus)} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Pieces</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Shipping</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              colSpan={7}
              loading={isLoading}
              error={error}
              empty={!data?.items?.length}
              emptyText={status || search || from || to ? 'No orders match these filters.' : 'No orders yet.'}
            />
            {(data?.items || []).map((order) => (
              <tr key={order.id}>
                <td>
                  <Link to={`/admin/orders/${order.id}`} className="admin-mono">
                    {order.orderNumber}
                  </Link>
                  <p className="admin-muted" style={{ margin: '0.3rem 0 0' }}>
                    {formatOrderDate(order.placedAt)}
                  </p>
                  <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                    {order.itemCount} {order.itemCount === 1 ? 'piece' : 'pieces'}
                  </p>
                </td>
                <td>
                  <strong>{order.customerName || '—'}</strong>
                  <p className="admin-muted" style={{ margin: '0.2rem 0 0' }}>
                    {order.email}
                  </p>
                  {order.phone ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{order.phone}</p> : null}
                  {order.city ? (
                    <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                      {[order.city, order.state].filter(Boolean).join(', ')}
                    </p>
                  ) : null}
                </td>
                <td>
                  <div className="admin-order-stack">
                    {(order.items || []).map((item) => (
                      <div key={item.id || item.sku} className="admin-piece">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="admin-thumb" />
                        ) : (
                          <div className="admin-thumb" />
                        )}
                        <div>
                          <strong>{item.productName}</strong>
                          {item.productTitle ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{item.productTitle}</p> : null}
                          <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>
                            {[item.colourName, item.size].filter(Boolean).join(' / ') || '—'}
                            {item.quantity ? ` · Qty ${item.quantity}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <select
                    value={order.status}
                    disabled={changeStatus.isPending || !order.transitions?.length}
                    aria-label={`Status of ${order.orderNumber}`}
                    onChange={(event) => onStatus(order, event.target.value)}
                  >
                    {[order.status, ...(order.transitions || [])].map((value) => (
                      <option key={value} value={value}>
                        {value === order.status ? orderStatusLabel(value) : `→ ${orderStatusLabel(value)}`}
                      </option>
                    ))}
                  </select>
                  {order.statusReason ? (
                    <p className="admin-muted" style={{ margin: '0.4rem 0 0', maxWidth: '16rem' }}>
                      {order.statusReason}
                    </p>
                  ) : null}
                </td>
                <td>
                  <span className={`admin-badge ${badgeClass(order.paymentStatus)}`}>
                    {paymentStatusLabel(order.paymentStatus)}
                  </span>
                  <p style={{ margin: '0.35rem 0 0' }}>{order.paymentLabel || '—'}</p>
                  {order.paidAt ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>Paid {formatOrderDate(order.paidAt)}</p> : null}
                </td>
                <td>
                  <p style={{ margin: 0 }}>{order.shippingLabel || '—'}</p>
                  {order.shippingEstimate ? <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{order.shippingEstimate}</p> : null}
                  <p className="admin-muted" style={{ margin: '0.15rem 0 0' }}>{Number(order.shipping) ? money(order.shipping) : 'Free'}</p>
                  {order.trackingNumber ? (
                    <p className="admin-mono" style={{ margin: '0.25rem 0 0' }}>
                      {order.carrier ? `${order.carrier} · ` : ''}
                      {order.trackingNumber}
                    </p>
                  ) : null}
                </td>
                <td>
                  <strong>{money(order.grandTotal)}</strong>
                  <p className="admin-muted" style={{ margin: '0.2rem 0 0' }}>
                    <Link to={`/admin/orders/${order.id}`}>Open</Link>
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data?.page || page} pageSize={data?.pageSize || 50} total={data?.total || 0} onPage={setPage} />
    </>
  );
}
