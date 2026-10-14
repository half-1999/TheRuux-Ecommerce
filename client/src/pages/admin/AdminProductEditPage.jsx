import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, UploadSimple } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { Field, Notice, PageHeader } from '../../components/admin/AdminUI';

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
  basePrice: '',
  compareAtPrice: '',
  status: 'draft',
  isNewArrival: false,
  isBestseller: false,
  allowsPersonalization: false,
  namingNote: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  categoryIds: [],
  collectionIds: [],
};

const ids = (list) => (list || []).map((c) => String(c?._id || c));

function mapProduct(p) {
  return {
    ...emptyForm,
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
    compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
    status: p.status || 'draft',
    isNewArrival: Boolean(p.isNewArrival),
    isBestseller: Boolean(p.isBestseller),
    allowsPersonalization: Boolean(p.allowsPersonalization),
    namingNote: p.namingNote || '',
    seoTitle: p.seo?.title || '',
    seoDescription: p.seo?.description || '',
    seoKeywords: p.seo?.keywords || '',
    categoryIds: ids(p.categoryIds),
    collectionIds: ids(p.collectionIds),
  };
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  else if (form.name.length > 40) errors.name = 'Keep the name to 40 characters.';
  if (!form.title.trim()) errors.title = 'Title is required.';
  const price = Number(form.basePrice);
  if (form.basePrice === '' || !Number.isFinite(price) || price < 0) errors.basePrice = 'Enter a price of 0 or more.';
  if (form.compareAtPrice !== '' && !(Number(form.compareAtPrice) > price)) {
    errors.compareAtPrice = 'Compare-at price must be higher than the price.';
  }
  if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = 'Use lowercase letters, numbers and dashes.';
  if (form.seoDescription.length > 320) errors.seoDescription = 'Keep it under 320 characters.';
  return errors;
}

export function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';

  const detail = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !isNew,
  });

  if (!isNew && detail.isLoading) return <p className="admin-muted">Loading product…</p>;
  if (!isNew && (detail.error || !detail.data?.product)) {
    return <Notice tone="error">{detail.error?.message || 'Product not found'}</Notice>;
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

function Checklist({ items, value, onChange, empty, manageTo }) {
  if (!items.length) {
    return (
      <p className="admin-muted">
        {empty} <Link to={manageTo}>Create one →</Link>
      </p>
    );
  }
  return (
    <div className="admin-checks">
      {items.map((item) => (
        <label key={item.id} className="admin-check">
          <input
            type="checkbox"
            checked={value.includes(item.id)}
            onChange={() => onChange(value.includes(item.id) ? value.filter((x) => x !== item.id) : [...value, item.id])}
          />
          <span>
            {item.name}
            {item.isActive === false ? <span className="admin-muted"> (hidden)</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function ProductEditor({ id, isNew, initialForm, initialDetail }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [variant, setVariant] = useState({ sku: '', size: 'M', colourName: 'Black', colourHex: '#111111', stockQty: 10 });
  const [igUrls, setIgUrls] = useState((initialDetail?.instagramLinks || []).map((l) => l.url).join('\n'));

  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const cols = useQuery({ queryKey: ['admin-collections'], queryFn: adminApi.collections });
  const detail = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !isNew,
    initialData: initialDetail || undefined,
  });

  const variants = detail.data?.variants || [];
  const images = isNew ? pendingImages : [...(detail.data?.product?.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-product', id] });
    qc.invalidateQueries({ queryKey: ['admin-products'] });
  };
  const fail = (err) => {
    if (err.details?.field) setErrors((x) => ({ ...x, [err.details.field]: err.message }));
    setMsg({ tone: 'error', text: err.message });
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        compareAtPrice: form.compareAtPrice === '' ? null : form.compareAtPrice,
        slug: form.slug || undefined,
      };
      if (isNew) {
        return adminApi.createProduct({
          ...body,
          images: pendingImages,
          variants: variant.sku ? [{ ...variant, stockQty: Number(variant.stockQty) || 0 }] : [],
        });
      }
      return adminApi.updateProduct(id, body);
    },
    onSuccess: (data) => {
      setMsg({ tone: 'ok', text: form.status === 'active' ? 'Saved and live on the store.' : 'Saved.' });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['admin-collections'] });
      const nextId = String(data?.product?._id || '');
      if (isNew && nextId) navigate(`/admin/products/${nextId}`, { replace: true });
      else refresh();
    },
    onError: fail,
  });

  const onSave = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setMsg({ tone: 'error', text: 'Fix the highlighted fields.' });
      return;
    }
    save.mutate();
  };

  const attach = async (url) => {
    if (!url) return;
    const img = { url, alt: `${form.name} ${form.title}`.trim(), kind: images.length ? 'other' : 'front' };
    if (isNew) {
      setPendingImages((list) => [...list, img]);
      return;
    }
    await adminApi.addImages(id, [{ ...img, sortOrder: images.length }]);
    refresh();
  };

  const onFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is over 8 MB.`);
        const res = await adminApi.upload(file);
        await attach(res.urlPackshot || res.url);
      }
      setMsg({ tone: 'ok', text: 'Images uploaded.' });
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (img, index) => {
    if (!window.confirm('Remove this image?')) return;
    if (isNew) return setPendingImages((list) => list.filter((_, i) => i !== index));
    try {
      await adminApi.deleteImage(id, img._id);
      refresh();
    } catch (err) {
      fail(err);
    }
  };

  const moveImage = async (index, dir) => {
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(index + dir, 0, moved);
    if (isNew) return setPendingImages(next);
    try {
      await adminApi.reorderImages(id, next.map((img) => String(img._id)));
      refresh();
    } catch (err) {
      fail(err);
    }
  };

  const addVariant = useMutation({
    mutationFn: () => adminApi.createVariant(id, { ...variant, stockQty: Number(variant.stockQty) || 0 }),
    onSuccess: () => {
      refresh();
      setVariant((v) => ({ ...v, sku: '' }));
      setMsg({ tone: 'ok', text: 'Variant added.' });
    },
    onError: fail,
  });

  const saveIg = useMutation({
    mutationFn: () => adminApi.setProductInstagram(id, igUrls.split('\n').map((u) => u.trim()).filter(Boolean)),
    onSuccess: () => setMsg({ tone: 'ok', text: '“Seen on” links saved.' }),
    onError: fail,
  });

  const archive = useMutation({
    mutationFn: () => adminApi.archiveProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    },
    onError: fail,
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Products', to: '/admin/products' }, { label: isNew ? 'New' : form.name || 'Edit' }]}
        title={isNew ? 'Create New Product' : `${initialForm.name} — ${initialForm.title}`}
        description={isNew ? 'Saved as a draft until you set the status to active.' : `/${initialForm.slug}`}
        actions={
          <>
            {!isNew && form.status === 'active' ? (
              <a className="admin-btn" href={`/product/${initialForm.slug}`} target="_blank" rel="noreferrer">
                View on store
              </a>
            ) : null}
            {!isNew ? (
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => window.confirm('Archive this product? It leaves the store.') && archive.mutate()}
              >
                Archive
              </button>
            ) : null}
            <button type="button" className="admin-btn admin-btn-primary" disabled={save.isPending || uploading} onClick={onSave}>
              {save.isPending ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
            </button>
          </>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>

      <div className="admin-form-grid">
        <div className="admin-stack">
          <section className="admin-card">
            <h2>Basic information</h2>
            <div className="admin-row">
              <Field label="Name (one word)" error={errors.name}>
                {(fid) => <input id={fid} value={form.name} onChange={set('name')} maxLength={40} required />}
              </Field>
              <Field label="Title" error={errors.title}>
                {(fid) => <input id={fid} value={form.title} onChange={set('title')} required />}
              </Field>
            </div>
            <Field label="Naming note (internal)">{(fid) => <input id={fid} value={form.namingNote} onChange={set('namingNote')} />}</Field>
          </section>

          <section className="admin-card">
            <h2>Description</h2>
            <Field label="Description">{(fid) => <textarea id={fid} value={form.description} onChange={set('description')} rows={4} />}</Field>
            <Field label="Details">{(fid) => <textarea id={fid} value={form.details} onChange={set('details')} />}</Field>
            <Field label="Key features" hint="One per line">
              {(fid) => <textarea id={fid} value={form.featuresText} onChange={set('featuresText')} rows={4} />}
            </Field>
            <div className="admin-row">
              <Field label="Fabric">{(fid) => <input id={fid} value={form.fabric} onChange={set('fabric')} />}</Field>
              <Field label="Fit">{(fid) => <input id={fid} value={form.fit} onChange={set('fit')} />}</Field>
              <Field label="Care">{(fid) => <input id={fid} value={form.care} onChange={set('care')} />}</Field>
            </div>
            <div className="admin-row">
              <Field label="Size guide">{(fid) => <textarea id={fid} value={form.sizeGuide} onChange={set('sizeGuide')} rows={3} />}</Field>
              <Field label="Model info">{(fid) => <textarea id={fid} value={form.modelInfo} onChange={set('modelInfo')} rows={3} />}</Field>
            </div>
          </section>

          <section className="admin-card">
            <h2>Images &amp; gallery</h2>
            <p className="admin-muted" style={{ marginTop: 0 }}>
              The first image is the card and listing thumbnail. JPG, PNG or WebP, up to 8 MB.
            </p>
            <div className="admin-gallery" style={{ marginBottom: '0.75rem' }}>
              {images.map((img, i) => (
                <figure key={img._id || `${img.url}-${i}`}>
                  <img src={img.url} alt={img.alt || ''} />
                  <figcaption>
                    <button type="button" className="admin-icon-btn" style={{ width: 26, height: 26 }} disabled={i === 0} onClick={() => moveImage(i, -1)} aria-label="Move earlier">
                      <ArrowLeft size={12} />
                    </button>
                    <span>{i === 0 ? 'Cover' : `#${i + 1}`}</span>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      style={{ width: 26, height: 26 }}
                      disabled={i === images.length - 1}
                      onClick={() => moveImage(i, 1)}
                      aria-label="Move later"
                    >
                      <ArrowRight size={12} />
                    </button>
                    <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeImage(img, i)}>
                      ✕
                    </button>
                  </figcaption>
                </figure>
              ))}
              {!images.length ? <p className="admin-muted">No images yet.</p> : null}
            </div>
            <div className="admin-image-actions">
              <label className="admin-btn">
                <UploadSimple size={14} /> {uploading ? 'Uploading…' : 'Upload images'}
                <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => onFiles([...e.target.files])} />
              </label>
              <input placeholder="or paste an image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} aria-label="Image URL" />
              <button
                type="button"
                className="admin-btn"
                disabled={!/^(https?:\/\/|\/)/.test(imageUrl)}
                onClick={async () => {
                  try {
                    await attach(imageUrl.trim());
                    setImageUrl('');
                  } catch (err) {
                    fail(err);
                  }
                }}
              >
                Add URL
              </button>
            </div>
          </section>

          <section className="admin-card">
            <h2>SKU, variants &amp; inventory</h2>
            {isNew ? (
              <>
                <p className="admin-muted" style={{ marginTop: 0 }}>
                  Optional first variant. Add more after creating the product.
                </p>
                <div className="admin-row">
                  {['sku', 'size', 'colourName', 'stockQty'].map((key) => (
                    <Field key={key} label={key === 'colourName' ? 'Colour' : key === 'stockQty' ? 'Stock' : key.toUpperCase()}>
                      {(fid) => <input id={fid} value={variant[key]} onChange={(e) => setVariant((v) => ({ ...v, [key]: e.target.value }))} />}
                    </Field>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="admin-table-wrap" style={{ marginBottom: '0.75rem' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Size</th>
                        <th>Colour</th>
                        <th>Stock</th>
                        <th>Active</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <VariantRow
                          key={v._id}
                          variant={v}
                          onSaved={(text, tone = 'ok') => {
                            setMsg({ tone, text });
                            refresh();
                            qc.invalidateQueries({ queryKey: ['admin-inventory'] });
                          }}
                        />
                      ))}
                      {!variants.length ? (
                        <tr>
                          <td colSpan={6} className="admin-muted">
                            No variants — customers can&apos;t buy this product until one exists.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="admin-row" style={{ alignItems: 'end' }}>
                  {['sku', 'size', 'colourName', 'colourHex', 'stockQty'].map((key) => (
                    <Field key={key} label={{ sku: 'New SKU', size: 'Size', colourName: 'Colour', colourHex: 'Hex', stockQty: 'Stock' }[key]}>
                      {(fid) => <input id={fid} value={variant[key]} onChange={(e) => setVariant((v) => ({ ...v, [key]: e.target.value }))} />}
                    </Field>
                  ))}
                  <div className="admin-field">
                    <button type="button" className="admin-btn" disabled={!variant.sku || addVariant.isPending} onClick={() => addVariant.mutate()}>
                      Add variant
                    </button>
                  </div>
                </div>
                <p className="admin-muted">
                  For audited stock changes use <Link to="/admin/inventory">Inventory</Link>.
                </p>
              </>
            )}
          </section>

          <section className="admin-card">
            <h2>SEO</h2>
            <Field label="URL slug" error={errors.slug} hint={isNew ? 'Leave empty to generate from name and title' : 'Changing this breaks existing links'}>
              {(fid) => <input id={fid} value={form.slug} onChange={set('slug')} />}
            </Field>
            <Field label="SEO title" hint={`${form.seoTitle.length}/160`}>
              {(fid) => <input id={fid} value={form.seoTitle} onChange={set('seoTitle')} maxLength={160} />}
            </Field>
            <Field label="SEO description" error={errors.seoDescription} hint={`${form.seoDescription.length}/320`}>
              {(fid) => <textarea id={fid} value={form.seoDescription} onChange={set('seoDescription')} rows={3} />}
            </Field>
            <Field label="Keywords">{(fid) => <input id={fid} value={form.seoKeywords} onChange={set('seoKeywords')} />}</Field>
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-card">
            <h2>Publishing</h2>
            <Field label="Status" hint={form.status === 'active' ? 'Visible on the storefront' : 'Hidden from the storefront'}>
              {(fid) => (
                <select id={fid} value={form.status} onChange={set('status')}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              )}
            </Field>
            <label className="admin-check">
              <input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} /> New arrival
            </label>
            <label className="admin-check">
              <input type="checkbox" checked={form.isBestseller} onChange={set('isBestseller')} /> Bestseller
            </label>
            <label className="admin-check">
              <input type="checkbox" checked={form.allowsPersonalization} onChange={set('allowsPersonalization')} /> Allows personalization
            </label>
          </section>

          <section className="admin-card">
            <h2>Pricing</h2>
            <div className="admin-row">
              <Field label="Price (INR)" error={errors.basePrice}>
                {(fid) => <input id={fid} type="number" min="0" step="1" inputMode="decimal" value={form.basePrice} onChange={set('basePrice')} />}
              </Field>
              <Field label="Compare-at (INR)" error={errors.compareAtPrice} hint="Shown struck through as the sale reference">
                {(fid) => <input id={fid} type="number" min="0" step="1" inputMode="decimal" value={form.compareAtPrice} onChange={set('compareAtPrice')} />}
              </Field>
            </div>
          </section>

          <section className="admin-card">
            <h2>Categories</h2>
            <Checklist
              items={cats.data?.items || []}
              value={form.categoryIds}
              onChange={(categoryIds) => setForm((f) => ({ ...f, categoryIds }))}
              empty="No categories yet."
              manageTo="/admin/categories"
            />
          </section>

          <section className="admin-card">
            <h2>Collections</h2>
            <Checklist
              items={cols.data?.items || []}
              value={form.collectionIds}
              onChange={(collectionIds) => setForm((f) => ({ ...f, collectionIds }))}
              empty="No collections yet."
              manageTo="/admin/collections"
            />
          </section>

          {!isNew ? (
            <section className="admin-card">
              <h2>Seen on Instagram</h2>
              <Field label="Post URLs" hint="One https:// link per line">
                {(fid) => <textarea id={fid} value={igUrls} onChange={(e) => setIgUrls(e.target.value)} rows={3} />}
              </Field>
              <button type="button" className="admin-btn" disabled={saveIg.isPending} onClick={() => saveIg.mutate()}>
                Save links
              </button>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function VariantRow({ variant, onSaved }) {
  const [sku, setSku] = useState(variant.sku || '');
  const [size, setSize] = useState(variant.size || '');
  const [colourName, setColourName] = useState(variant.colourName || '');
  const [stockQty, setStockQty] = useState(variant.stockQty ?? 0);
  const [isActive, setIsActive] = useState(variant.isActive !== false);
  const id = variant._id || variant.id;

  const save = useMutation({
    mutationFn: () => adminApi.updateVariant(id, { sku, size, colourName, stockQty: Math.max(0, Number(stockQty) || 0), isActive }),
    onSuccess: () => onSaved(`${sku} saved.`),
    onError: (err) => onSaved(err.message, 'error'),
  });

  return (
    <tr>
      <td>
        <input value={sku} onChange={(e) => setSku(e.target.value)} aria-label="SKU" className="admin-mono" />
      </td>
      <td>
        <input value={size} onChange={(e) => setSize(e.target.value)} style={{ width: 64 }} aria-label="Size" />
      </td>
      <td>
        <input value={colourName} onChange={(e) => setColourName(e.target.value)} aria-label="Colour" />
      </td>
      <td>
        <input type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} style={{ width: 80 }} aria-label="Stock" />
      </td>
      <td>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} aria-label="Active" />
      </td>
      <td>
        <button type="button" className="admin-btn admin-btn-sm" disabled={save.isPending} onClick={() => save.mutate()}>
          Save
        </button>
      </td>
    </tr>
  );
}
