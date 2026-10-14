import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, PencilSimple, Plus } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { Notice, PageHeader, Pagination, TableState, Thumb } from '../../components/admin/AdminUI';
import { fmtDate, fmtInr, useDebounced } from '../../components/admin/adminFormat';

const STOCK_BADGE = { in: ['ok', 'In stock'], low: ['warn', 'Low stock'], out: ['danger', 'Out of stock'] };
const STATUS_BADGE = { active: 'ok', draft: 'warn', archived: '' };

export function AdminProductsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ q: '', status: '', category: '', collection: '', stock: '', sort: 'updated' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState(null);
  const q = useDebounced(filters.q);

  const params = Object.fromEntries(Object.entries({ ...filters, q, page }).filter(([, v]) => v !== ''));
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => adminApi.products(params),
    placeholderData: keepPreviousData,
  });
  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const cols = useQuery({ queryKey: ['admin-collections'], queryFn: adminApi.collections });

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
    setSelected([]);
  };

  const done = (text) => {
    setMsg({ tone: 'ok', text });
    setSelected([]);
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['admin-metrics'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const archive = useMutation({ mutationFn: adminApi.archiveProduct, onSuccess: () => done('Product archived — hidden from the store.'), onError: fail });
  const bulk = useMutation({
    mutationFn: (status) => adminApi.bulkProductStatus(selected, status),
    onSuccess: (r, status) => done(`${r.count} product(s) set to ${status}.`),
    onError: fail,
  });
  const duplicate = useMutation({
    mutationFn: adminApi.duplicateProduct,
    onSuccess: (r) => {
      done('Draft copy created.');
      navigate(`/admin/products/${r.product._id}`);
    },
    onError: fail,
  });

  const items = data?.items || [];
  const allSelected = items.length > 0 && items.every((p) => selected.includes(p.id));

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Products' }]}
        title="Products"
        description="Everything in the catalog. Only active products appear on the storefront."
        actions={
          <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
            <Plus size={14} /> Create New Product
          </Link>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>

      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Search name, title, slug or SKU" value={filters.q} onChange={setFilter('q')} aria-label="Search products" />
        <select value={filters.status} onChange={setFilter('status')} aria-label="Status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filters.category} onChange={setFilter('category')} aria-label="Category">
          <option value="">All categories</option>
          {(cats.data?.items || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filters.collection} onChange={setFilter('collection')} aria-label="Collection">
          <option value="">All collections</option>
          {(cols.data?.items || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filters.stock} onChange={setFilter('stock')} aria-label="Stock">
          <option value="">Any stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select value={filters.sort} onChange={setFilter('sort')} aria-label="Sort">
          <option value="updated">Recently updated</option>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="price_asc">Price low–high</option>
          <option value="price_desc">Price high–low</option>
        </select>
        {isFetching && !isLoading ? <span className="admin-muted">Updating…</span> : null}
      </div>

      {selected.length ? (
        <div className="admin-bulkbar" role="region" aria-label="Bulk actions">
          <strong>{selected.length} selected</strong>
          <button type="button" className="admin-btn admin-btn-sm" disabled={bulk.isPending} onClick={() => bulk.mutate('active')}>
            Publish
          </button>
          <button type="button" className="admin-btn admin-btn-sm" disabled={bulk.isPending} onClick={() => bulk.mutate('draft')}>
            Move to draft
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-danger"
            disabled={bulk.isPending}
            onClick={() => window.confirm(`Archive ${selected.length} product(s)? They leave the store.`) && bulk.mutate('archived')}
          >
            Archive
          </button>
          <button type="button" className="admin-btn admin-btn-sm" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? [] : items.map((p) => p.id))}
                />
              </th>
              <th>Product</th>
              <th>SKU</th>
              <th>Categories · Collections</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <TableState
              colSpan={9}
              loading={isLoading}
              error={error}
              empty={!items.length}
              emptyText={Object.values(filters).some((v) => v && v !== 'updated') ? 'No products match these filters.' : 'No products yet.'}
              action={
                <Link to="/admin/products/new" className="admin-btn admin-btn-primary admin-btn-sm">
                  Create New Product
                </Link>
              }
            />
            {items.map((p) => {
              const [tone, label] = STOCK_BADGE[p.stockStatus] || STOCK_BADGE.out;
              return (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.includes(p.id)}
                      onChange={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                    />
                  </td>
                  <td>
                    <Link to={`/admin/products/${p.id}`} className="admin-cell-main">
                      <Thumb src={p.image?.url} alt={p.image?.alt} />
                      <span>
                        <strong>{p.name}</strong>
                        <span className="admin-muted">{p.title}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="admin-mono">
                    {p.skus?.length ? p.skus.join(', ') : <span className="admin-muted">—</span>}
                    {p.variantCount > p.skus?.length ? <div className="admin-muted">+{p.variantCount - p.skus.length} more</div> : null}
                  </td>
                  <td>
                    <div className="admin-tags">
                      {p.categories.map((c) => (
                        <span key={c.id} className="admin-badge">
                          {c.name}
                        </span>
                      ))}
                      {p.collections.map((c) => (
                        <span key={c.id} className="admin-badge ok">
                          {c.name}
                        </span>
                      ))}
                      {!p.categories.length && !p.collections.length ? <span className="admin-muted">Unassigned</span> : null}
                    </div>
                  </td>
                  <td>
                    {fmtInr(p.basePrice)}
                    {p.compareAtPrice ? (
                      <div className="admin-muted">
                        <s>{fmtInr(p.compareAtPrice)}</s>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`admin-badge ${tone}`}>{label}</span>
                    <div className="admin-muted">
                      {p.stockTotal} units · {p.variantCount} variants
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${STATUS_BADGE[p.status] ?? ''}`}>{p.status}</span>
                  </td>
                  <td className="admin-muted">{fmtDate(p.updatedAt)}</td>
                  <td>
                    <div className="admin-actions">
                      {p.status === 'active' ? (
                        <a className="admin-btn admin-btn-sm" href={`/product/${p.slug}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : null}
                      <Link to={`/admin/products/${p.id}`} className="admin-btn admin-btn-sm" aria-label={`Edit ${p.name}`}>
                        <PencilSimple size={13} /> Edit
                      </Link>
                      <button type="button" className="admin-btn admin-btn-sm" disabled={duplicate.isPending} onClick={() => duplicate.mutate(p.id)} aria-label={`Duplicate ${p.name}`}>
                        <Copy size={13} />
                      </button>
                      {p.status !== 'archived' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          disabled={archive.isPending}
                          onClick={() => window.confirm(`Archive ${p.name}? It will leave the store.`) && archive.mutate(p.id)}
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={data?.page || page} pageSize={data?.pageSize || 25} total={data?.total || 0} onPage={setPage} />
    </>
  );
}
