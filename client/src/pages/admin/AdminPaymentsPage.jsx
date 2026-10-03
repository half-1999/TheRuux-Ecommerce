import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminPaymentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-commerce'],
    queryFn: adminApi.commerce,
  });
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState({ label: '', detail: '', enabled: true });

  const save = useMutation({
    mutationFn: ({ id, body }) => adminApi.updatePayment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-commerce'] });
      qc.invalidateQueries({ queryKey: ['commerce-options'] });
      setMsg('Payment method updated.');
    },
    onError: (err) => setMsg(err.message),
  });

  const create = useMutation({
    mutationFn: adminApi.createPayment,
    onSuccess: () => {
      setDraft({ label: '', detail: '', enabled: true });
      setMsg('Payment method added.');
      qc.invalidateQueries({ queryKey: ['admin-commerce'] });
      qc.invalidateQueries({ queryKey: ['commerce-options'] });
    },
    onError: (err) => setMsg(err.message),
  });

  const remove = useMutation({
    mutationFn: adminApi.deletePayment,
    onSuccess: () => {
      setMsg('Payment method removed.');
      qc.invalidateQueries({ queryKey: ['admin-commerce'] });
      qc.invalidateQueries({ queryKey: ['commerce-options'] });
    },
    onError: (err) => setMsg(err.message),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Payment methods</h1>
      </div>
      {error ? <p className="admin-error">{error.message}</p> : null}
      {msg ? <p className="admin-muted">{msg}</p> : null}
      {isLoading ? <p>Loading…</p> : null}
      <div className="admin-row">
        {(data?.paymentMethods || []).map((method) => (
          <PaymentCard
            key={method.id}
            method={method}
            onSave={(body) => save.mutate({ id: method.id, body })}
            onDelete={() => {
              if (window.confirm(`Remove ${method.label}?`)) remove.mutate(method.id);
            }}
            pending={save.isPending || remove.isPending}
          />
        ))}
      </div>

      <form
        className="admin-card"
        style={{ maxWidth: 520, marginTop: '1rem' }}
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(draft);
        }}
      >
        <p className="admin-metric-label">Add payment method</p>
        <div className="admin-field">
          <label>Label</label>
          <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} required />
        </div>
        <div className="admin-field">
          <label>Detail</label>
          <input value={draft.detail} onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))} />
        </div>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={create.isPending}>
          Add method
        </button>
      </form>
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
      <div className="admin-field">
        <label>Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} required />
      </div>
      <div className="admin-field">
        <label>Detail</label>
        <input value={detail} onChange={(e) => setDetail(e.target.value)} />
      </div>
      <label className="admin-muted" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled at checkout
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
          Save
        </button>
        <button type="button" className="admin-btn" disabled={pending} onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}
