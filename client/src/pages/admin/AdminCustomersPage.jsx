import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { PageHeader, Pagination, TableState } from '../../components/admin/AdminUI';
import { fmtDate, fmtInr, useDebounced } from '../../components/admin/adminFormat';

export function AdminCustomersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);
  const params = { ...(search ? { q: search } : {}), ...(status ? { status } : {}), page };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-customers', params],
    queryFn: () => adminApi.customers(params),
    placeholderData: keepPreviousData,
  });
  const items = data?.items || [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Customers' }]}
        title="Customers"
        description="Registered accounts. Spend counts verified paid orders only, excluding cancellations and refunds."
      />
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Search name, email or phone"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          aria-label="Search customers"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total spend</th>
              <th>Last order</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <TableState colSpan={7} loading={isLoading} error={error} empty={!items.length} emptyText={q || status ? 'No customers match.' : 'No customers yet.'} />
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/admin/customers/${c.id}`} className="admin-cell-main">
                    <span>
                      <strong>{c.name}</strong>
                      <span className="admin-muted">{c.email}</span>
                    </span>
                  </Link>
                </td>
                <td>{c.phone || <span className="admin-muted">—</span>}</td>
                <td>{c.orderCount}</td>
                <td>{fmtInr(c.totalSpend)}</td>
                <td className="admin-muted">{fmtDate(c.lastOrderAt)}</td>
                <td>
                  <span className={`admin-badge ${c.status === 'active' ? 'ok' : 'warn'}`}>{c.status}</span>
                </td>
                <td className="admin-muted">{fmtDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data?.page || page} pageSize={data?.pageSize || 25} total={data?.total || 0} onPage={setPage} />
    </>
  );
}
