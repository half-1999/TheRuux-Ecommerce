import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { Dialog, Notice, PageHeader, Pagination, TableState, Thumb } from '../../components/admin/AdminUI';
import { useDebounced } from '../../components/admin/adminFormat';

const BADGE = { in: ['ok', 'In stock'], low: ['warn', 'Low'], out: ['danger', 'Out'] };
const REASONS = ['Restock', 'Stock count correction', 'Damaged', 'Returned to stock', 'Sample / shoot'];

export function AdminInventoryPage() {
  const [q, setQ] = useState('');
  const [stock, setStock] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(null);
  const [msg, setMsg] = useState(null);
  const search = useDebounced(q);

  const params = { ...(search ? { q: search } : {}), ...(stock ? { stock } : {}), page };
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-inventory', params],
    queryFn: () => adminApi.inventory(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  });
  const items = data?.items || [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Inventory' }]}
        title="Inventory"
        description={`Every stock change is recorded with a reason. Low stock means ${data?.threshold ?? 5} units or fewer.`}
        actions={
          <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
            Create New Product
          </Link>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Search SKU or product"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          aria-label="Search inventory"
        />
        <div className="admin-tabs" role="tablist" aria-label="Stock filter">
          {[
            ['', 'All'],
            ['low', 'Low stock'],
            ['out', 'Out of stock'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={stock === value}
              onClick={() => {
                setStock(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Variant</th>
              <th>Stock</th>
              <th>Adjust</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <TableState colSpan={6} loading={isLoading} error={error} empty={!items.length} emptyText={stock ? 'Nothing here — good news.' : 'No variants found.'} />
            {items.map((row) => (
              <InventoryRow key={row.id} row={row} onDone={setMsg} onHistory={() => setHistory(row)} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data?.page || page} pageSize={data?.pageSize || 50} total={data?.total || 0} onPage={setPage} />
      <HistoryDialog row={history} onClose={() => setHistory(null)} />
    </>
  );
}

function InventoryRow({ row, onDone, onHistory }) {
  const qc = useQueryClient();
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [tone, label] = BADGE[row.stockStatus] || BADGE.in;
  const n = Number(delta);
  const valid = Number.isInteger(n) && n !== 0 && row.stockQty + n >= 0;

  const adjust = useMutation({
    mutationFn: () => adminApi.adjustInventory({ variantId: row.id, delta: n, reason }),
    onSuccess: () => {
      onDone({ tone: 'ok', text: `${row.sku}: ${n > 0 ? '+' : ''}${n} (${reason}).` });
      setDelta('');
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory-history', row.id] });
    },
    onError: (err) => onDone({ tone: 'error', text: `${row.sku}: ${err.message}` }),
  });

  return (
    <tr>
      <td>
        {row.product ? (
          <Link to={`/admin/products/${row.product.id}`} className="admin-cell-main">
            <Thumb src={row.product.imageUrl} size="sm" />
            <span>
              <strong>{row.product.name}</strong>
              <span className="admin-muted">{row.product.title}</span>
            </span>
          </Link>
        ) : (
          <span className="admin-muted">Missing product</span>
        )}
      </td>
      <td className="admin-mono">{row.sku}</td>
      <td>
        {row.size} · {row.colourName}
        {row.isActive === false ? <div className="admin-muted">Inactive</div> : null}
      </td>
      <td>
        <span className={`admin-badge ${tone}`}>
          {row.stockQty} · {label}
        </span>
      </td>
      <td>
        <form
          className="admin-actions"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) adjust.mutate();
          }}
        >
          <input
            type="number"
            step="1"
            placeholder="±"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            style={{ width: 72 }}
            aria-label={`Change stock for ${row.sku}`}
            aria-invalid={delta !== '' && !valid}
          />
          <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-sm" disabled={!valid || adjust.isPending}>
            Apply
          </button>
        </form>
        {delta !== '' && row.stockQty + n < 0 ? <span className="admin-field-error">Stock can&apos;t go below 0</span> : null}
      </td>
      <td>
        <button type="button" className="admin-btn admin-btn-sm" onClick={onHistory}>
          History
        </button>
      </td>
    </tr>
  );
}

function HistoryDialog({ row, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-inventory-history', row?.id],
    queryFn: () => adminApi.inventoryHistory(row.id),
    enabled: Boolean(row),
  });
  const items = data?.items || [];
  return (
    <Dialog open={Boolean(row)} title={`Stock history · ${row?.sku || ''}`} onClose={onClose}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Change</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          <TableState colSpan={3} loading={isLoading} error={error} empty={!items.length} emptyText="No adjustments recorded yet." />
          {items.map((h) => (
            <tr key={h.id}>
              <td className="admin-muted">{new Date(h.at).toLocaleString('en-IN')}</td>
              <td className="admin-mono">{h.delta > 0 ? `+${h.delta}` : h.delta}</td>
              <td>
                {h.reason}
                {h.orderId ? (
                  <div>
                    <Link to={`/admin/orders/${h.orderId}`}>View order</Link>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
