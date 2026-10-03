import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

const empty = { name: '', priceInr: 0, estimate: '', enabled: true };

export function AdminShippingPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-commerce'],
    queryFn: adminApi.commerce,
  });
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState(empty);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-commerce'] });
    qc.invalidateQueries({ queryKey: ['commerce-options'] });
  };

  const create = useMutation({
    mutationFn: adminApi.createShipping,
    onSuccess: () => {
      setDraft(empty);
      setMsg('Shipping method added.');
      refresh();
    },
    onError: (err) => setMsg(err.message),
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateShipping(id, body),
    onSuccess: () => {
      setMsg('Shipping method saved.');
      refresh();
    },
    onError: (err) => setMsg(err.message),
  });

  const remove = useMutation({
    mutationFn: adminApi.deleteShipping,
    onSuccess: () => {
      setMsg('Shipping method removed.');
      refresh();
    },
    onError: (err) => setMsg(err.message),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Shipping methods</h1>
      </div>
      {error ? <p className="admin-error">{error.message}</p> : null}
      {msg ? <p className="admin-muted">{msg}</p> : null}
      {isLoading ? <p>Loading…</p> : null}

      <div className="admin-row">
        {(data?.shippingMethods || []).map((method) => (
          <ShippingCard
            key={method.id}
            method={method}
            pending={update.isPending || remove.isPending}
            onSave={(body) => update.mutate({ id: method.id, body })}
            onDelete={() => {
              if (window.confirm(`Remove ${method.name}?`)) remove.mutate(method.id);
            }}
          />
        ))}
      </div>

      <form
        className="admin-card"
        style={{ maxWidth: 520, marginTop: '1rem' }}
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({ ...draft, priceInr: Number(draft.priceInr) || 0 });
        }}
      >
        <p className="admin-metric-label">Add shipping method</p>
        <div className="admin-field">
          <label>Name</label>
          <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
        </div>
        <div className="admin-field">
          <label>Price (INR)</label>
          <input
            type="number"
            min="0"
            value={draft.priceInr}
            onChange={(e) => setDraft((d) => ({ ...d, priceInr: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>Estimated delivery</label>
          <input
            value={draft.estimate}
            onChange={(e) => setDraft((d) => ({ ...d, estimate: e.target.value }))}
            placeholder="3–5 business days"
          />
        </div>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={create.isPending}>
          Add method
        </button>
      </form>
    </>
  );
}

function ShippingCard({ method, onSave, onDelete, pending }) {
  const [name, setName] = useState(method.name);
  const [priceInr, setPrice] = useState(method.priceInr ?? 0);
  const [estimate, setEstimate] = useState(method.estimate || '');
  const [enabled, setEnabled] = useState(Boolean(method.enabled));

  return (
    <form
      className="admin-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name, priceInr: Number(priceInr) || 0, estimate, enabled });
      }}
    >
      <p className="admin-mono">{method.id}</p>
      <div className="admin-field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="admin-field">
        <label>Price (INR)</label>
        <input type="number" min="0" value={priceInr} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div className="admin-field">
        <label>Estimated delivery</label>
        <input value={estimate} onChange={(e) => setEstimate(e.target.value)} />
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
