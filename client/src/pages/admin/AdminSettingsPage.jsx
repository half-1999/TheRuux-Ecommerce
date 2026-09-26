import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  if (isLoading) return <p>Loading…</p>;
  if (!data) return <p className="admin-error">Could not load settings</p>;

  return <SettingsForm key={JSON.stringify(data)} initial={data} />;
}

function SettingsForm({ initial }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    lowStockThreshold: initial.lowStockThreshold ?? 5,
    shippingStandardInr: initial.shippingStandardInr ?? 0,
    taxMode: initial.taxMode || 'inclusive',
    storePhone: initial.storePhone || '',
    instagramUrl: initial.instagramUrl || '',
  });
  const [msg, setMsg] = useState('');

  const save = useMutation({
    mutationFn: () =>
      adminApi.patchSettings({
        ...form,
        lowStockThreshold: Number(form.lowStockThreshold),
        shippingStandardInr: Number(form.shippingStandardInr),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setMsg('Settings saved. Secrets remain in server env only.');
    },
    onError: (e) => setMsg(e.message),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Settings</h1>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => save.mutate()}>
          Save
        </button>
      </div>
      {msg ? <p className="admin-muted">{msg}</p> : null}
      <div className="admin-card" style={{ maxWidth: 520 }}>
        <div className="admin-field">
          <label>Low stock threshold</label>
          <input
            type="number"
            value={form.lowStockThreshold}
            onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>Standard shipping (INR)</label>
          <input
            type="number"
            value={form.shippingStandardInr}
            onChange={(e) => setForm((f) => ({ ...f, shippingStandardInr: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>Tax mode</label>
          <select value={form.taxMode} onChange={(e) => setForm((f) => ({ ...f, taxMode: e.target.value }))}>
            <option value="inclusive">inclusive</option>
            <option value="exclusive">exclusive</option>
            <option value="none">none</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Store phone</label>
          <input value={form.storePhone} onChange={(e) => setForm((f) => ({ ...f, storePhone: e.target.value }))} />
        </div>
        <div className="admin-field">
          <label>Instagram URL</label>
          <input
            value={form.instagramUrl}
            onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
          />
        </div>
        <p className="admin-muted">
          Razorpay / Cloudinary / email secrets are env-only and never returned by this API.
        </p>
      </div>
    </>
  );
}
