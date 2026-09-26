import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminProductsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-products', q, status],
    queryFn: () =>
      adminApi.products({
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      }),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          Create product
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          placeholder="Search name / title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error ? <p className="admin-error">{error.message}</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Status</th>
              <th>Price</th>
              <th>Flags</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : null}
            {(data?.items || []).map((p) => (
              <tr key={p.id}>
                <td className="admin-mono">{p.name}</td>
                <td>{p.title}</td>
                <td>
                  <span className="admin-badge">{p.status}</span>
                </td>
                <td>₹{p.basePrice}</td>
                <td className="admin-muted">
                  {p.isNewArrival ? 'NEW ' : ''}
                  {p.isBestseller ? 'BEST' : ''}
                </td>
                <td>
                  <Link to={`/admin/products/${p.id}`} className="admin-btn">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length ? (
              <tr>
                <td colSpan={6} className="admin-muted">
                  No products. Seed the DB or create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
