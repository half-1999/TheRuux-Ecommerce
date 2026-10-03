import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const [form, setForm] = useState({ name: '', slug: '', sortOrder: 0 });
  const items = data?.items || data || [];

  const create = useMutation({
    mutationFn: () => adminApi.createCategory(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      setForm({ name: '', slug: '', sortOrder: 0 });
    },
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Categories</h1>
      </div>
      <div className="admin-card admin-row" style={{ marginBottom: '1rem' }}>
        <div className="admin-field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="admin-field">
          <label>Slug</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </div>
        <div className="admin-field">
          <label>Sort</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => create.mutate()}>
            Create
          </button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Sort</th>
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
                <td>{c.sortOrder}</td>
                <td>{c.isActive ? 'yes' : 'no'}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      const name = window.prompt('Category name', c.name);
                      if (!name) return;
                      adminApi.updateCategory(c._id || c.id, { name, slug: c.slug, sortOrder: c.sortOrder }).then(() =>
                        qc.invalidateQueries({ queryKey: ['admin-categories'] }),
                      );
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    style={{ marginLeft: '0.4rem' }}
                    onClick={() =>
                      adminApi.deleteCategory(c._id || c.id).then(() =>
                        qc.invalidateQueries({ queryKey: ['admin-categories'] }),
                      )
                    }
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
