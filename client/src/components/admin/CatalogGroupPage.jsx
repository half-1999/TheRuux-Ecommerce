import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from '@phosphor-icons/react';
import { Dialog, Field, ImageField, Notice, PageHeader, TableState, Thumb } from './AdminUI';
import { fmtDate } from './adminFormat';

const slugOk = (s) => !s || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

const toForm = (fields, item = {}) => ({
  ...Object.fromEntries(fields.map((f) => [f.key, item[f.key] ?? (f.type === 'number' ? 0 : '')])),
  isActive: item.isActive !== false,
  seoTitle: item.seo?.title || '',
  seoDescription: item.seo?.description || '',
});

/** Only send what changed so edits never wipe fields the dialog doesn't show. */
function toBody(fields, form, original) {
  const body = {};
  for (const f of fields) {
    const value = f.type === 'number' ? Number(form[f.key]) || 0 : String(form[f.key] ?? '').trim();
    if (!original || value !== original[f.key]) body[f.key] = value;
  }
  if (!original || form.isActive !== original.isActive) body.isActive = form.isActive;
  if (!original || form.seoTitle !== original.seoTitle || form.seoDescription !== original.seoDescription) {
    body.seo = { title: form.seoTitle.trim(), description: form.seoDescription.trim() };
  }
  return body;
}

/**
 * Shared CRUD for categories and collections.
 * `config` = { noun, plural, queryKey, list, create, update, remove, fields, imageKey, descKey, storePath }
 */
export function CatalogGroupPage({ config }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: [config.queryKey], queryFn: config.list });
  const [editing, setEditing] = useState(null); // { item|null, form, original }
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [q, setQ] = useState('');

  const items = (data?.items || []).filter((c) => !q || `${c.name} ${c.slug}`.toLowerCase().includes(q.toLowerCase()));

  const refresh = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: [config.queryKey] });
    qc.invalidateQueries({ queryKey: ['admin-products'] });
  };
  const fail = (err) => {
    if (err.status === 409) setErrors({ slug: err.message });
    setMsg({ tone: 'error', text: err.message });
  };

  const open = (item) => {
    const form = toForm(config.fields, item || {});
    setErrors({});
    setEditing({ item, form, original: item ? form : null });
  };
  const setField = (key, value) => setEditing((e) => ({ ...e, form: { ...e.form, [key]: value } }));

  const save = useMutation({
    mutationFn: () => {
      const body = toBody(config.fields, editing.form, editing.original);
      return editing.item ? config.update(editing.item.id, body) : config.create(body);
    },
    onSuccess: () => {
      refresh(`${config.noun} ${editing.item ? 'updated' : 'created'}.`);
      setEditing(null);
    },
    onError: fail,
  });
  const toggle = useMutation({
    mutationFn: (c) => (c.isActive !== false ? config.remove(c.id) : config.update(c.id, { isActive: true })),
    onSuccess: (_r, c) => refresh(`${c.name} ${c.isActive !== false ? 'hidden from the store' : 'visible again'}.`),
    onError: fail,
  });

  const onSave = () => {
    const f = editing.form;
    const found = {};
    if (!f.name.trim()) found.name = 'Name is required.';
    if (!slugOk(f.slug)) found.slug = 'Use lowercase letters, numbers and dashes.';
    setErrors(found);
    if (!Object.keys(found).length) save.mutate();
  };

  const create = (
    <button type="button" className="admin-btn admin-btn-primary" onClick={() => open(null)}>
      <Plus size={14} /> Create New {config.noun}
    </button>
  );

  return (
    <>
      <PageHeader crumbs={[{ label: config.plural }]} title={config.plural} description={config.description} actions={create} />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder={`Search ${config.plural.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{config.noun}</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Order</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <TableState
              colSpan={7}
              loading={isLoading}
              error={error}
              empty={!items.length}
              emptyText={q ? `No ${config.plural.toLowerCase()} match “${q}”.` : `No ${config.plural.toLowerCase()} yet.`}
              action={q ? null : create}
            />
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="admin-cell-main">
                    <Thumb src={c[config.imageKey]} />
                    <span>
                      <strong>{c.name}</strong>
                      {c[config.descKey] ? <span className="admin-muted">{String(c[config.descKey]).slice(0, 80)}</span> : null}
                    </span>
                  </span>
                </td>
                <td className="admin-mono">{c.slug}</td>
                <td>
                  {c.productCount?.active ?? 0} live
                  <div className="admin-muted">{c.productCount?.total ?? 0} total</div>
                </td>
                <td>{c.sortOrder ?? 0}</td>
                <td>
                  <span className={`admin-badge ${c.isActive !== false ? 'ok' : ''}`}>{c.isActive !== false ? 'Visible' : 'Hidden'}</span>
                </td>
                <td className="admin-muted">{fmtDate(c.updatedAt)}</td>
                <td>
                  <div className="admin-actions">
                    {c.isActive !== false ? (
                      <a className="admin-btn admin-btn-sm" href={`${config.storePath}/${c.slug}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : null}
                    <button type="button" className="admin-btn admin-btn-sm" onClick={() => open(c)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`admin-btn admin-btn-sm ${c.isActive !== false ? 'admin-btn-danger' : ''}`}
                      disabled={toggle.isPending}
                      onClick={() =>
                        c.isActive === false ||
                        window.confirm(`Hide ${c.name} from the store? Its ${c.productCount?.total ?? 0} product link(s) are kept.`)
                          ? toggle.mutate(c)
                          : null
                      }
                    >
                      {c.isActive !== false ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(editing)}
        wide
        title={editing?.item ? `Edit ${editing.item.name}` : `Create New ${config.noun}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="admin-btn" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn-primary" disabled={save.isPending} onClick={onSave}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {editing ? (
          <div className="admin-form-grid">
            <div className="admin-stack">
              {config.fields
                .filter((f) => f.key !== config.imageKey)
                .map((f) => (
                  <Field key={f.key} label={f.label} error={errors[f.key]} hint={f.hint}>
                    {(fid) =>
                      f.type === 'textarea' ? (
                        <textarea id={fid} rows={4} maxLength={f.max} value={editing.form[f.key]} onChange={(e) => setField(f.key, e.target.value)} />
                      ) : (
                        <input
                          id={fid}
                          type={f.type === 'number' ? 'number' : 'text'}
                          min={f.type === 'number' ? 0 : undefined}
                          maxLength={f.max}
                          value={editing.form[f.key]}
                          onChange={(e) => setField(f.key, e.target.value)}
                        />
                      )
                    }
                  </Field>
                ))}
              <Field label="SEO title">{(fid) => <input id={fid} maxLength={160} value={editing.form.seoTitle} onChange={(e) => setField('seoTitle', e.target.value)} />}</Field>
              <Field label="SEO description">
                {(fid) => <textarea id={fid} rows={2} maxLength={320} value={editing.form.seoDescription} onChange={(e) => setField('seoDescription', e.target.value)} />}
              </Field>
            </div>
            <div className="admin-stack">
              <ImageField label={config.imageLabel} value={editing.form[config.imageKey]} onChange={(url) => setField(config.imageKey, url)} aspect={config.aspect} />
              <label className="admin-check">
                <input type="checkbox" checked={editing.form.isActive} onChange={(e) => setField('isActive', e.target.checked)} /> Visible on the storefront
              </label>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
