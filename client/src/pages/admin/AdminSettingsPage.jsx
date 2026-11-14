import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { Field, Notice, PageHeader } from '../../components/admin/AdminUI';
import { useAuthStore } from '../../store/authStore';

export function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  if (isLoading) return <p className="admin-muted">Loading settings…</p>;
  if (error || !data) return <Notice tone="error">{error?.message || 'Could not load settings'}</Notice>;
  return <SettingsForm key={JSON.stringify(data)} initial={data} />;
}

function MfaCard() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  const applyUser = (next) => setSession({ user: next, accessToken });

  const start = useMutation({
    mutationFn: adminApi.setupMfa,
    onSuccess: (data) => {
      setSetup(data);
      setMsg(null);
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });

  const enable = useMutation({
    mutationFn: () => adminApi.confirmMfa(code),
    onSuccess: (next) => {
      applyUser(next);
      setSetup(null);
      setCode('');
      setMsg({ tone: 'ok', text: 'Authenticator is on. The next sign-in will ask for a code.' });
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });

  const disable = useMutation({
    mutationFn: () => adminApi.disableMfa({ password, code }),
    onSuccess: (next) => {
      applyUser(next);
      setPassword('');
      setCode('');
      setMsg({ tone: 'ok', text: 'Authenticator is off.' });
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });

  return (
    <section className="admin-card" style={{ marginBottom: '1rem' }}>
      <h2>Authenticator</h2>
      <p className="admin-muted">
        {user?.totpEnabled
          ? 'Sign-in requires the 6-digit code from your authenticator app.'
          : 'Turn this on after you add TheRuux to an authenticator app. Sign-in stays password-only until you confirm a code.'}
      </p>
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {user?.totpEnabled ? (
        <>
          <Field label="Password">
            {(fid) => (
              <input id={fid} type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Field label="Current authenticator code">
            {(fid) => <input id={fid} inputMode="numeric" value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} />}
          </Field>
          <button type="button" className="admin-btn" disabled={disable.isPending} onClick={() => disable.mutate()}>
            Turn off authenticator
          </button>
        </>
      ) : (
        <>
          <button type="button" className="admin-btn" disabled={start.isPending} onClick={() => start.mutate()}>
            {setup ? 'Generate a new secret' : 'Set up authenticator'}
          </button>
          {setup ? (
            <>
              <p className="admin-muted">Add this secret in your authenticator app, then enter the 6-digit code.</p>
              <p style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>{setup.secret}</p>
              <Field label="Code">
                {(fid) => <input id={fid} inputMode="numeric" value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} />}
              </Field>
              <button type="button" className="admin-btn admin-btn-primary" disabled={enable.isPending} onClick={() => enable.mutate()}>
                Confirm and turn on
              </button>
            </>
          ) : null}
        </>
      )}
    </section>
  );
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
      <MfaCard />
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
