import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';
import { Field, Notice, PageHeader, TableState } from '../../components/admin/AdminUI';
import { fmtDate, fmtInr } from '../../components/admin/adminFormat';

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-customer', id], queryFn: () => adminApi.customer(id) });

  if (isLoading) return <p className="admin-muted">Loading customer…</p>;
  if (error || !data?.user) return <Notice tone="error">{error?.message || 'Customer not found'}</Notice>;
  return <CustomerDetail key={data.user._id} id={id} data={data} />;
}

function CustomerDetail({ id, data }) {
  const qc = useQueryClient();
  const { user, summary, orders = [] } = data;
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const [msg, setMsg] = useState(null);

  const refresh = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    qc.invalidateQueries({ queryKey: ['admin-customers'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const save = useMutation({ mutationFn: () => adminApi.updateCustomer(id, form), onSuccess: () => refresh('Customer updated.'), onError: fail });
  const setStatus = useMutation({
    mutationFn: (status) => adminApi.setCustomerStatus(id, status),
    onSuccess: (_r, status) => refresh(status === 'disabled' ? 'Account disabled — they can no longer sign in.' : 'Account enabled.'),
    onError: fail,
  });
  const active = user.status === 'active';
  const dirty = form.name !== (user.name || '') || form.phone !== (user.phone || '');

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Customers', to: '/admin/customers' }, { label: user.name }]}
        title={user.name}
        description={`${user.email} · joined ${fmtDate(user.createdAt)}`}
        actions={
          <button
            type="button"
            className={`admin-btn ${active ? 'admin-btn-danger' : ''}`}
            disabled={setStatus.isPending}
            onClick={() => (!active || window.confirm(`Disable ${user.name}? They will be blocked from signing in.`)) && setStatus.mutate(active ? 'disabled' : 'active')}
          >
            {active ? 'Disable account' : 'Enable account'}
          </button>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>

      <div className="admin-grid-metrics">
        {[
          ['Orders', summary.orderCount],
          ['Total spend', fmtInr(summary.totalSpend)],
          ['Last order', fmtDate(summary.lastOrderAt)],
          ['Phone', user.phone || '—'],
        ].map(([label, value]) => (
          <div key={label} className="admin-card">
            <div className="admin-metric-label">{label}</div>
            <div className="admin-metric-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="admin-form-grid">
        <section className="admin-card">
          <h2>Orders</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <TableState colSpan={5} empty={!orders.length} emptyText="No orders yet." />
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <Link to={`/admin/orders/${o._id}`} className="admin-mono">
                        {o.orderNumber}
                      </Link>
                      <div className="admin-muted">{(o.items || []).map((i) => `${i.productName} ×${i.quantity}`).join(', ')}</div>
                    </td>
                    <td className="admin-muted">{fmtDate(o.placedAt)}</td>
                    <td>{orderStatusLabel(o.status)}</td>
                    <td>{paymentStatusLabel(o.paymentStatus)}</td>
                    <td>{fmtInr(o.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card">
          <h2>Profile</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim()) save.mutate();
            }}
          >
            <Field label="Name" error={!form.name.trim() ? 'Name is required.' : null}>
              {(fid) => <input id={fid} value={form.name} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
            </Field>
            <Field label="Phone">
              {(fid) => <input id={fid} type="tel" value={form.phone} maxLength={32} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />}
            </Field>
            <Field label="Email" hint="Customers change their own email from their account.">
              {(fid) => <input id={fid} value={user.email} readOnly />}
            </Field>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={!dirty || !form.name.trim() || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
