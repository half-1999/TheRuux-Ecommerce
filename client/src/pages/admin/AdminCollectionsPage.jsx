import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminCollectionsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: adminApi.collections,
  });
  const [form, setForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    conceptLine: '',
    story: '',
  });
  const items = data?.items || data || [];

  const create = useMutation({
    mutationFn: () => adminApi.createCollection(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-collections'] });
      setForm({ name: '', slug: '', tagline: '', conceptLine: '', story: '' });
    },
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Collections</h1>
      </div>
      <div className="admin-card" style={{ marginBottom: '1rem' }}>
        <div className="admin-row">
          {['name', 'slug', 'tagline', 'conceptLine'].map((key) => (
            <div className="admin-field" key={key}>
              <label>{key}</label>
              <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="admin-field">
          <label>Story</label>
          <textarea value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))} />
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => create.mutate()}>
          Create collection
        </button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Tagline</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>Loading…</td>
              </tr>
            ) : null}
            {items.map((c) => (
              <tr key={c._id || c.id}>
                <td>{c.name}</td>
                <td className="admin-mono">{c.slug}</td>
                <td>{c.tagline}</td>
                <td>{c.isActive !== false ? 'yes' : 'no'}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      const name = window.prompt('Collection name', c.name);
                      if (!name) return;
                      adminApi.updateCollection(c._id || c.id, { ...c, name }).then(() =>
                        qc.invalidateQueries({ queryKey: ['admin-collections'] }),
                      );
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ marginLeft: '0.4rem' }}
                    onClick={() => {
                      if (!window.confirm(`Disable ${c.name}?`)) return;
                      adminApi.deleteCollection(c._id || c.id).then(() =>
                        qc.invalidateQueries({ queryKey: ['admin-collections'] }),
                      );
                    }}
                  >
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
