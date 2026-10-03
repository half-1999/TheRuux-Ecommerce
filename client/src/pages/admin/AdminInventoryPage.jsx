import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

export function AdminInventoryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [adjust, setAdjust] = useState({ variantId: '', delta: 0, reason: 'manual' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', q, lowStock],
    queryFn: () => adminApi.inventory({ ...(q ? { q } : {}), lowStock: String(lowStock) }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 8000,
  });

  const mutate = useMutation({
    mutationFn: () =>
      adminApi.adjustInventory({
        variantId: adjust.variantId,
        delta: Number(adjust.delta),
        reason: adjust.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      setAdjust({ variantId: '', delta: 0, reason: 'manual' });
    },
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Inventory</h1>
      </div>
      <div className="admin-toolbar">
        <input placeholder="SKU search" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="admin-muted" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
          Low stock only (≤ {data?.threshold ?? 5})
        </label>
      </div>

      <div className="admin-card admin-row" style={{ marginBottom: '1rem' }}>
        <div className="admin-field">
          <label>Variant ID</label>
          <input
            value={adjust.variantId}
            onChange={(e) => setAdjust((a) => ({ ...a, variantId: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>Delta</label>
          <input
            type="number"
            value={adjust.delta}
            onChange={(e) => setAdjust((a) => ({ ...a, delta: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>Reason</label>
          <input
            value={adjust.reason}
            onChange={(e) => setAdjust((a) => ({ ...a, reason: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => mutate.mutate()}>
            Adjust stock
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Size</th>
              <th>Colour</th>
              <th>Stock</th>
              <th>Variant ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : null}
            {(data?.items || []).map((row) => (
              <tr key={row.id}>
                <td className="admin-mono">{row.sku}</td>
                <td>
                  {row.product?.name} {row.product?.title}
                </td>
                <td>{row.size}</td>
                <td>{row.colourName}</td>
                <td>
                  <span className={`admin-badge ${row.lowStock ? 'warn' : 'ok'}`}>{row.stockQty}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setAdjust((a) => ({ ...a, variantId: row.id }))}
                  >
                    Use
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
