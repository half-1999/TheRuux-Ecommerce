import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminCustomersPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', q],
    queryFn: () => adminApi.customers(q ? { q } : {}),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Customers</h1>
      </div>
      <div className="admin-toolbar">
        <input placeholder="Search name / email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : null}
            {(data?.items || []).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/admin/customers/${c.id}`}>{c.name}</Link>
                </td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.orderCount ?? 0}</td>
                <td>
                  <span className={`admin-badge ${c.status === 'active' ? 'ok' : 'warn'}`}>{c.status}</span>
                </td>
                <td className="admin-muted">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
