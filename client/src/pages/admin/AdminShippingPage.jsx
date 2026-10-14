import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { Dialog, Field, Notice, PageHeader } from '../../components/admin/AdminUI';

const empty = { name: '', priceInr: 0, estimate: '', enabled: true };

export function AdminShippingPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-commerce'], queryFn: adminApi.commerce });
  const [msg, setMsg] = useState(null);
  const [draft, setDraft] = useState(empty);
  const [creating, setCreating] = useState(false);

  const done = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: ['admin-commerce'] });
    qc.invalidateQueries({ queryKey: ['commerce-options'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const create = useMutation({
    mutationFn: adminApi.createShipping,
    onSuccess: () => {
      setDraft(empty);
      setCreating(false);
      done('Shipping method added.');
    },
    onError: fail,
  });
  const update = useMutation({ mutationFn: ({ id, body }) => adminApi.updateShipping(id, body), onSuccess: () => done('Shipping method saved.'), onError: fail });
  const remove = useMutation({ mutationFn: adminApi.deleteShipping, onSuccess: () => done('Shipping method removed.'), onError: fail });
  const methods = data?.shippingMethods || [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Shipping' }]}
        title="Shipping methods"
        description="Options customers choose at checkout. Courier tracking numbers are added on each order when it ships."
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreating(true)}>
            <Plus size={14} /> Create Shipping Method
          </button>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {error ? <Notice tone="error">{error.message}</Notice> : null}
      {isLoading ? <p className="admin-muted">Loading…</p> : null}
      {!isLoading && !methods.length ? (
        <div className="admin-card admin-empty">
          <p>No shipping methods — customers can&apos;t check out until one is enabled.</p>
        </div>
      ) : null}

      <div className="admin-row">
        {methods.map((method) => (
          <ShippingCard
            key={method.id}
            method={method}
            pending={update.isPending || remove.isPending}
            onSave={(body) => update.mutate({ id: method.id, body })}
            onDelete={() => window.confirm(`Remove ${method.name}? Customers can no longer choose it.`) && remove.mutate(method.id)}
          />
        ))}
      </div>

      <Dialog
        open={creating}
        title="Create Shipping Method"
        onClose={() => setCreating(false)}
        footer={
          <button type="submit" form="new-shipping" className="admin-btn admin-btn-primary" disabled={create.isPending || !draft.name.trim()}>
            Add method
          </button>
        }
      >
        <form
          id="new-shipping"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate({ ...draft, priceInr: Math.max(0, Number(draft.priceInr) || 0) });
          }}
        >
          <Field label="Name">{(fid) => <input id={fid} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />}</Field>
          <Field label="Price (INR)">
            {(fid) => <input id={fid} type="number" min="0" value={draft.priceInr} onChange={(e) => setDraft((d) => ({ ...d, priceInr: e.target.value }))} />}
          </Field>
          <Field label="Estimated delivery">
            {(fid) => <input id={fid} value={draft.estimate} placeholder="3–5 business days" onChange={(e) => setDraft((d) => ({ ...d, estimate: e.target.value }))} />}
          </Field>
        </form>
      </Dialog>
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
        onSave({ name, priceInr: Math.max(0, Number(priceInr) || 0), estimate, enabled });
      }}
    >
      <p className="admin-mono">{method.id}</p>
      <Field label="Name">{(fid) => <input id={fid} value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
      <Field label="Price (INR)">{(fid) => <input id={fid} type="number" min="0" value={priceInr} onChange={(e) => setPrice(e.target.value)} />}</Field>
      <Field label="Estimated delivery">{(fid) => <input id={fid} value={estimate} onChange={(e) => setEstimate(e.target.value)} />}</Field>
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
