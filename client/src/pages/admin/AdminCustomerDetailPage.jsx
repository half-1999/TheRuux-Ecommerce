import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminApi.customer(id),
  });

  const setStatus = useMutation({
    mutationFn: (status) => adminApi.setCustomerStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-customer', id] }),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error || !data?.user) return <p className="admin-error">{error?.message || 'Not found'}</p>;

  const user = data.user;

  return (
    <>
      <div className="admin-topbar">
        <h1>{user.name}</h1>
        <Link to="/admin/customers" className="admin-btn">
          Back
        </Link>
      </div>
      <div className="admin-card">
        <p>{user.email}</p>
        <p className="admin-muted" style={{ marginTop: '0.5rem' }}>
          Status: {user.status}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="admin-btn"
            onClick={() => setStatus.mutate(user.status === 'active' ? 'disabled' : 'active')}
          >
            {user.status === 'active' ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
      <div className="admin-topbar" style={{ marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1rem' }}>Orders</h1>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(data.orders || []).map((o) => (
              <tr key={o._id || o.id}>
                <td>
                  <Link to={`/admin/orders/${o._id || o.id}`} className="admin-mono">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{o.status}</td>
                <td>₹{Number(o.grandTotal).toFixed(2)}</td>
              </tr>
            ))}
            {!data.orders?.length ? (
              <tr>
                <td colSpan={3} className="admin-muted">
                  No orders
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
