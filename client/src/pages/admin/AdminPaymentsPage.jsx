import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';
import { Dialog, Field, Notice, PageHeader, Pagination, TableState } from '../../components/admin/AdminUI';
import { fmtInr, useDebounced } from '../../components/admin/adminFormat';

const STATUS_TONE = { PAID: 'ok', PENDING: 'warn', FAILED: 'danger', REFUNDED: '', PARTIAL_REFUND: '' };

export function AdminPaymentsPage() {
  const [tab, setTab] = useState('transactions');
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Payments' }]}
        title="Payments"
        description="Gateway transactions are read-only here — payment status only changes through verified provider webhooks."
        actions={
          tab === 'methods' ? (
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreating(true)}>
              <Plus size={14} /> Create Payment Method
            </button>
          ) : null
        }
      />
      <div className="admin-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        <button type="button" role="tab" aria-selected={tab === 'transactions'} onClick={() => setTab('transactions')}>
          Transactions
        </button>
        <button type="button" role="tab" aria-selected={tab === 'methods'} onClick={() => setTab('methods')}>
          Checkout methods
        </button>
      </div>
      {tab === 'transactions' ? <Transactions /> : <Methods creating={creating} setCreating={setCreating} />}
    </>
  );
}

function Transactions() {
  const [filters, setFilters] = useState({ q: '', status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const q = useDebounced(filters.q);
  const params = Object.fromEntries(Object.entries({ ...filters, q, page }).filter(([, v]) => v !== ''));
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-transactions', params],
    queryFn: () => adminApi.transactions(params),
    placeholderData: keepPreviousData,
  });
  const items = data?.items || [];
  const set = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  return (
    <>
      {data?.summary?.length ? (
        <div className="admin-grid-metrics">
          {data.summary.map((s) => (
            <div key={s.status} className="admin-card">
              <div className="admin-metric-label">{paymentStatusLabel(s.status)}</div>
              <div className="admin-metric-value">{fmtInr(s.amount)}</div>
              <div className="admin-metric-sub">{s.count} transaction(s), all time</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Order number, email or gateway ID" value={filters.q} onChange={set('q')} aria-label="Search transactions" />
        <select value={filters.status} onChange={set('status')} aria-label="Status">
          <option value="">All statuses</option>
          {Object.keys(STATUS_TONE).map((s) => (
            <option key={s} value={s}>
              {paymentStatusLabel(s)}
            </option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={set('from')} aria-label="From date" />
        <input type="date" value={filters.to} onChange={set('to')} aria-label="To date" />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Provider</th>
              <th>Gateway IDs</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <TableState colSpan={7} loading={isLoading} error={error} empty={!items.length} emptyText="No transactions match." />
            {items.map((t) => (
              <tr key={t.id}>
                <td className="admin-muted">{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                <td>
                  {t.order ? (
                    <>
                      <Link to={`/admin/orders/${t.order.id}`} className="admin-mono">
                        {t.order.orderNumber}
                      </Link>
                      <div className="admin-muted">{orderStatusLabel(t.order.status)}</div>
                    </>
                  ) : (
                    <span className="admin-muted">—</span>
                  )}
                </td>
                <td>
                  {t.order?.customerName}
                  <div className="admin-muted">{t.order?.email}</div>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{t.provider}</td>
                <td className="admin-mono" style={{ fontSize: 11 }}>
                  {t.gatewayOrderId || '—'}
                  {t.transactionId ? <div className="admin-muted">{t.transactionId}</div> : null}
                </td>
                <td>{fmtInr(t.amount)}</td>
                <td>
                  <span className={`admin-badge ${STATUS_TONE[t.status] ?? ''}`}>{paymentStatusLabel(t.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data?.page || page} pageSize={data?.pageSize || 25} total={data?.total || 0} onPage={setPage} />
    </>
  );
}

function Methods({ creating, setCreating }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-commerce'], queryFn: adminApi.commerce });
  const [msg, setMsg] = useState(null);
  const [draft, setDraft] = useState({ label: '', detail: '', enabled: true });

  const done = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: ['admin-commerce'] });
    qc.invalidateQueries({ queryKey: ['commerce-options'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const save = useMutation({ mutationFn: ({ id, body }) => adminApi.updatePayment(id, body), onSuccess: () => done('Payment method updated.'), onError: fail });
  const create = useMutation({
    mutationFn: adminApi.createPayment,
    onSuccess: () => {
      setDraft({ label: '', detail: '', enabled: true });
      setCreating(false);
      done('Payment method added.');
    },
    onError: fail,
  });
  const remove = useMutation({ mutationFn: adminApi.deletePayment, onSuccess: () => done('Payment method removed.'), onError: fail });

  return (
    <>
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {error ? <Notice tone="error">{error.message}</Notice> : null}
      {isLoading ? <p className="admin-muted">Loading…</p> : null}
      <div className="admin-row">
        {(data?.paymentMethods || []).map((method) => (
          <PaymentCard
            key={method.id}
            method={method}
            onSave={(body) => save.mutate({ id: method.id, body })}
            onDelete={() => window.confirm(`Remove ${method.label}? Customers can no longer choose it at checkout.`) && remove.mutate(method.id)}
            pending={save.isPending || remove.isPending}
          />
        ))}
      </div>
      <Dialog
        open={creating}
        title="Create Payment Method"
        onClose={() => setCreating(false)}
        footer={
          <button type="submit" form="new-payment" className="admin-btn admin-btn-primary" disabled={create.isPending || !draft.label.trim()}>
            Add method
          </button>
        }
      >
        <form
          id="new-payment"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(draft);
          }}
        >
          <Field label="Label">{(fid) => <input id={fid} value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} required />}</Field>
          <Field label="Detail">{(fid) => <input id={fid} value={draft.detail} onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))} />}</Field>
        </form>
      </Dialog>
    </>
  );
}

function PaymentCard({ method, onSave, onDelete, pending }) {
  const [label, setLabel] = useState(method.label);
  const [detail, setDetail] = useState(method.detail || '');
  const [enabled, setEnabled] = useState(Boolean(method.enabled));

  return (
    <form
      className="admin-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ label, detail, enabled });
      }}
    >
      <p className="admin-mono">{method.id}</p>
      <Field label="Label">{(fid) => <input id={fid} value={label} onChange={(e) => setLabel(e.target.value)} required />}</Field>
      <Field label="Detail">{(fid) => <input id={fid} value={detail} onChange={(e) => setDetail(e.target.value)} />}</Field>
      <label className="admin-check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled at checkout
      </label>
      <div className="admin-actions" style={{ marginTop: '0.75rem' }}>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
          Save
        </button>
        <button type="button" className="admin-btn admin-btn-danger" disabled={pending} onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}
