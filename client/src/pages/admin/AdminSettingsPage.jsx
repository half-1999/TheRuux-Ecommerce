import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { Field, Notice, PageHeader } from '../../components/admin/AdminUI';

export function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  if (isLoading) return <p className="admin-muted">Loading settings…</p>;
  if (error || !data) return <Notice tone="error">{error?.message || 'Could not load settings'}</Notice>;
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
  const [msg, setMsg] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const igInvalid = form.instagramUrl && !/^https?:\/\//i.test(form.instagramUrl);

  const save = useMutation({
    mutationFn: () =>
      adminApi.patchSettings({
        ...form,
        lowStockThreshold: Number(form.lowStockThreshold),
        shippingStandardInr: Number(form.shippingStandardInr),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setMsg({ tone: 'ok', text: 'Settings saved.' });
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Settings' }]}
        title="Store settings"
        description="Payment, media and email credentials live only in server environment variables and are never shown here."
        actions={
          <>
            <Link to="/admin/navigation" className="admin-btn">
              Edit admin navigation
            </Link>
            <button type="button" className="admin-btn admin-btn-primary" disabled={save.isPending || igInvalid} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      <div className="admin-row">
        <section className="admin-card">
          <h2>Inventory &amp; pricing</h2>
          <Field label="Low stock threshold" hint="Variants at or below this count are flagged">
            {(fid) => <input id={fid} type="number" min="0" max="1000" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />}
          </Field>
          <Field label="Standard shipping (INR)">
            {(fid) => <input id={fid} type="number" min="0" value={form.shippingStandardInr} onChange={set('shippingStandardInr')} />}
          </Field>
          <Field label="Tax mode">
            {(fid) => (
              <select id={fid} value={form.taxMode} onChange={set('taxMode')}>
                <option value="inclusive">Prices include tax</option>
                <option value="exclusive">Tax added at checkout</option>
                <option value="none">No tax</option>
              </select>
            )}
          </Field>
        </section>
        <section className="admin-card">
          <h2>Contact &amp; social</h2>
          <Field label="Store phone">{(fid) => <input id={fid} type="tel" value={form.storePhone} onChange={set('storePhone')} />}</Field>
          <Field label="Instagram URL" error={igInvalid ? 'Use a full https:// link.' : null}>
            {(fid) => <input id={fid} type="url" value={form.instagramUrl} onChange={set('instagramUrl')} />}
          </Field>
        </section>
      </div>
    </>
  );
}
