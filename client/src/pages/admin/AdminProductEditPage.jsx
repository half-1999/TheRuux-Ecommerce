import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

const emptyForm = {
  name: '',
  title: '',
  slug: '',
  description: '',
  details: '',
  fabric: '',
  fit: '',
  care: 'COLD WASH. LOW DRAMA.',
  modelInfo: '',
  sizeGuide: '',
  featuresText: '',
  basePrice: '5490',
  status: 'draft',
  isNewArrival: false,
  isBestseller: false,
  allowsPersonalization: false,
  namingNote: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
};

function mapProduct(p) {
  return {
    name: p.name || '',
    title: p.title || '',
    slug: p.slug || '',
    description: p.description || '',
    details: p.details || '',
    fabric: p.fabric || '',
    fit: p.fit || '',
    care: p.care || '',
    modelInfo: p.modelInfo || '',
    sizeGuide: p.sizeGuide || '',
    featuresText: (p.features || []).join('\n'),
    basePrice: String(p.basePrice ?? ''),
    status: p.status || 'draft',
    isNewArrival: Boolean(p.isNewArrival),
    isBestseller: Boolean(p.isBestseller),
    allowsPersonalization: Boolean(p.allowsPersonalization),
    namingNote: p.namingNote || '',
    seoTitle: p.seo?.title || '',
    seoDescription: p.seo?.description || '',
    seoKeywords: p.seo?.keywords || '',
  };
}

export function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';

  const detail = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !isNew,
  });

  if (!isNew && detail.isLoading) return <p>Loading…</p>;
  if (!isNew && (detail.error || !detail.data?.product)) {
    return <p className="admin-error">{detail.error?.message || 'Product not found'}</p>;
  }

  return (
    <ProductEditor
      key={isNew ? 'new' : String(detail.data.product._id)}
      id={id}
      isNew={isNew}
      initialForm={isNew ? emptyForm : mapProduct(detail.data.product)}
      initialDetail={isNew ? null : detail.data}
    />
  );
}

function ProductEditor({ id, isNew, initialForm, initialDetail }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [variant, setVariant] = useState({
    sku: '',
    size: 'M',
    colourName: 'Black',
    colourHex: '#111111',
    stockQty: 10,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [igUrls, setIgUrls] = useState('');
  const [catIds, setCatIds] = useState(
    (initialDetail?.product?.categoryIds || []).map((c) => c._id || c).join(','),
  );
  const [colIds, setColIds] = useState(
    (initialDetail?.product?.collectionIds || []).map((c) => c._id || c).join(','),
  );
  const [message, setMessage] = useState('');

  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const cols = useQuery({ queryKey: ['admin-collections'], queryFn: adminApi.collections });
  const detail = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !isNew,
    initialData: initialDetail || undefined,
  });

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        basePrice: form.basePrice,
        featuresText: form.featuresText,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: form.seoKeywords,
      };
      if (isNew) {
        return adminApi.createProduct({
          ...body,
          variants: variant.sku
            ? [
                {
                  sku: variant.sku,
                  size: variant.size,
                  colourName: variant.colourName,
                  colourHex: variant.colourHex,
                  stockQty: Number(variant.stockQty) || 0,
                },
              ]
            : [],
        });
      }
      return adminApi.updateProduct(id, body);
    },
    onSuccess: (data) => {
      setMessage('Saved.');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      const nextId = String(data?.product?._id || data?.product?.id || id || '');
      if (isNew && nextId && nextId !== 'new') {
        navigate(`/admin/products/${nextId}`, { replace: true });
      } else if (!isNew) {
        qc.invalidateQueries({ queryKey: ['admin-product', id] });
      }
    },
    onError: (err) => setMessage(err.message),
  });

  const addVariant = useMutation({
    mutationFn: () =>
      adminApi.createVariant(id, {
        ...variant,
        stockQty: Number(variant.stockQty) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
      setMessage('Variant added.');
    },
    onError: (err) => setMessage(err.message),
  });

  const addImage = useMutation({
    mutationFn: () =>
      adminApi.addImages(id, [{ url: imageUrl, alt: form.name, kind: 'front', sortOrder: 0 }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
      setImageUrl('');
      setMessage('Image attached.');
    },
    onError: (err) => setMessage(err.message),
  });

  const archive = useMutation({
    mutationFn: () => adminApi.archiveProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    },
  });

  const variants = detail.data?.variants || [];
  const images = detail.data?.product?.images || [];

  return (
    <>
      <div className="admin-topbar">
        <h1>{isNew ? 'New product' : `Edit · ${form.name || 'Product'}`}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin/products" className="admin-btn">
            Back
          </Link>
          {!isNew ? (
            <button type="button" className="admin-btn admin-btn-danger" onClick={() => archive.mutate()}>
              Archive
            </button>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {message ? <p className="admin-muted">{message}</p> : null}

      <div className="admin-row">
        <div className="admin-card">
          <div className="admin-field">
            <label>Name</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
          <div className="admin-field">
            <label>Title</label>
            <input value={form.title} onChange={set('title')} required />
          </div>
          <div className="admin-field">
            <label>Slug</label>
            <input value={form.slug} onChange={set('slug')} placeholder="auto if empty on create" />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label>Base price (INR)</label>
              <input value={form.basePrice} onChange={set('basePrice')} />
            </div>
            <div className="admin-field">
              <label>Status</label>
              <select value={form.status} onChange={set('status')}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
          <label className="admin-muted" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} /> New arrival
          </label>
          <label className="admin-muted" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={form.isBestseller} onChange={set('isBestseller')} /> Bestseller
          </label>
          <label className="admin-muted" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.allowsPersonalization}
              onChange={set('allowsPersonalization')}
            />{' '}
            Allows personalization
          </label>
          <div className="admin-field">
            <label>Naming note (provisional conflicts)</label>
            <input value={form.namingNote} onChange={set('namingNote')} />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-field">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} />
          </div>
          <div className="admin-field">
            <label>Details</label>
            <textarea value={form.details} onChange={set('details')} />
          </div>
          <div className="admin-field">
            <label>Key features (one per line)</label>
            <textarea value={form.featuresText} onChange={set('featuresText')} rows={5} />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label>Fabric</label>
              <input value={form.fabric} onChange={set('fabric')} />
            </div>
            <div className="admin-field">
              <label>Fit</label>
              <input value={form.fit} onChange={set('fit')} />
            </div>
          </div>
          <div className="admin-field">
            <label>Care</label>
            <input value={form.care} onChange={set('care')} />
          </div>
          <div className="admin-field">
            <label>Size guide</label>
            <textarea value={form.sizeGuide} onChange={set('sizeGuide')} rows={3} />
          </div>
          <div className="admin-field">
            <label>Model info</label>
            <input value={form.modelInfo} onChange={set('modelInfo')} />
          </div>
          <div className="admin-field">
            <label>SEO title</label>
            <input value={form.seoTitle} onChange={set('seoTitle')} />
          </div>
          <div className="admin-field">
            <label>SEO description</label>
            <textarea value={form.seoDescription} onChange={set('seoDescription')} />
          </div>
          <div className="admin-field">
            <label>SEO keywords</label>
            <input value={form.seoKeywords} onChange={set('seoKeywords')} />
          </div>
        </div>
      </div>

      {!isNew ? (
        <>
          <div className="admin-topbar" style={{ marginTop: '1.25rem' }}>
            <h1 style={{ fontSize: '1rem' }}>Variants</h1>
          </div>
          <div className="admin-table-wrap" style={{ marginBottom: '0.75rem' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Size</th>
                  <th>Colour</th>
                  <th>Stock</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v._id || v.id}>
                    <td className="admin-mono">{v.sku}</td>
                    <td>{v.size}</td>
                    <td>{v.colourName}</td>
                    <td>{v.stockQty}</td>
                    <td>{v.isActive ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-card admin-row">
            {['sku', 'size', 'colourName', 'colourHex', 'stockQty'].map((key) => (
              <div className="admin-field" key={key}>
                <label>{key}</label>
                <input
                  value={variant[key]}
                  onChange={(e) => setVariant((v) => ({ ...v, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button type="button" className="admin-btn" onClick={() => addVariant.mutate()}>
                Add variant
              </button>
            </div>
          </div>

          <div className="admin-topbar" style={{ marginTop: '1.25rem' }}>
            <h1 style={{ fontSize: '1rem' }}>Images</h1>
          </div>
          <div className="admin-card">
            <ul className="admin-muted" style={{ marginBottom: '0.75rem' }}>
              {images.map((img) => (
                <li key={img._id || img.url} style={{ marginBottom: '0.35rem' }}>
                  {img.kind}: {img.url}{' '}
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() =>
                      adminApi.deleteImage(id, img._id).then(() =>
                        qc.invalidateQueries({ queryKey: ['admin-product', id] }),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="admin-toolbar">
              <input
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button type="button" className="admin-btn" onClick={() => addImage.mutate()}>
                Attach URL
              </button>
            </div>
          </div>

          <div className="admin-topbar" style={{ marginTop: '1.25rem' }}>
            <h1 style={{ fontSize: '1rem' }}>Categories / Collections / Seen On</h1>
          </div>
          <div className="admin-card admin-row">
            <div className="admin-field">
              <label>Category IDs (comma)</label>
              <input value={catIds} onChange={(e) => setCatIds(e.target.value)} />
              <button
                type="button"
                className="admin-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  const categoryIds = catIds.split(',').map((s) => s.trim()).filter(Boolean);
                  adminApi.setProductCategories(id, categoryIds).then(() => setMessage('Categories set'));
                }}
              >
                Save categories
              </button>
              <p className="admin-muted" style={{ marginTop: '0.5rem' }}>
                Available:{' '}
                {(cats.data?.items || cats.data || [])
                  .map((c) => `${c.name}=${c._id || c.id}`)
                  .join(' · ')}
              </p>
            </div>
            <div className="admin-field">
              <label>Collection IDs (comma)</label>
              <input value={colIds} onChange={(e) => setColIds(e.target.value)} />
              <button
                type="button"
                className="admin-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  const collectionIds = colIds.split(',').map((s) => s.trim()).filter(Boolean);
                  adminApi
                    .setProductCollections(id, collectionIds)
                    .then(() => setMessage('Collections set'));
                }}
              >
                Save collections
              </button>
              <p className="admin-muted" style={{ marginTop: '0.5rem' }}>
                Available:{' '}
                {(cols.data?.items || cols.data || [])
                  .map((c) => `${c.name}=${c._id || c.id}`)
                  .join(' · ')}
              </p>
            </div>
            <div className="admin-field">
              <label>Instagram URLs (one per line)</label>
              <textarea value={igUrls} onChange={(e) => setIgUrls(e.target.value)} />
              <button
                type="button"
                className="admin-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() =>
                  adminApi
                    .setProductInstagram(
                      id,
                      igUrls
                        .split('\n')
                        .map((u) => u.trim())
                        .filter(Boolean),
                    )
                    .then(() => setMessage('Instagram URLs saved'))
                }
              >
                Save Seen On
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-card" style={{ marginTop: '1rem' }}>
          <p className="admin-muted">Optional first variant on create</p>
          <div className="admin-row">
            {['sku', 'size', 'colourName', 'stockQty'].map((key) => (
              <div className="admin-field" key={key}>
                <label>{key}</label>
                <input
                  value={variant[key]}
                  onChange={(e) => setVariant((v) => ({ ...v, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
