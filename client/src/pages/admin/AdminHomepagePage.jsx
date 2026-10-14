import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, catalogApi } from '../../api/client';
import { Field, ImageField, Notice, PageHeader } from '../../components/admin/AdminUI';
import { fmtDate } from '../../components/admin/adminFormat';

const PAGE_SLUGS = ['about-us', 'our-story', 'size-guide', 'shipping-delivery', 'returns-exchanges', 'faqs', 'contact', 'privacy', 'terms'];

/** Only the fields each storefront section actually renders. */
const SECTION_SPEC = {
  hero: { label: 'Hero', fields: ['title', 'subtitle', 'ctaLabel', 'ctaHref', 'media'], hints: { title: 'Large script headline' } },
  new_arrivals: { label: 'New arrivals', fields: ['eyebrow', 'title', 'ctaLabel', 'ctaHref'] },
  udbhav: {
    label: 'Featured collection (Udbhav)',
    fields: ['eyebrow', 'title', 'subtitle', 'body', 'ctaLabel', 'ctaHref', 'image'],
    note: 'Empty fields fall back to the Udbhav collection’s own name, concept line, story and hero image.',
  },
  categories: { label: 'Find your silhouette', fields: ['eyebrow', 'title', 'subtitle'], note: 'Tiles come from visible categories — manage them under Categories.' },
  bestsellers: { label: 'Bestsellers', fields: ['eyebrow', 'title', 'ctaLabel', 'ctaHref', 'image'] },
  instagram: {
    label: 'The Ruux, out there',
    fields: ['title', 'subtitle', 'ctaLabel', 'ctaHref', 'gallery'],
    hints: { ctaHref: 'Instagram profile URL' },
  },
  newsletter: { label: 'Newsletter', fields: ['title', 'body'] },
};

const LABELS = {
  eyebrow: 'Eyebrow label',
  title: 'Heading',
  subtitle: 'Subheading',
  body: 'Body text',
  ctaLabel: 'Button label',
  ctaHref: 'Button link',
};
const LIMITS = { eyebrow: 80, title: 160, subtitle: 300, body: 2000, ctaLabel: 40, ctaHref: 1000 };
const linkOk = (v) => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v);

function statusOf(s) {
  if (!(s.draft || s.live).isActive) return ['', 'Hidden'];
  if (s.draft) return ['warn', 'Unpublished changes'];
  if (s.publishedAt) return ['ok', 'Published'];
  return ['', 'Built-in copy'];
}

function toForm(s) {
  const src = s.draft || s.live;
  return {
    title: src.title || '',
    subtitle: src.subtitle || '',
    body: src.body || '',
    ctaLabel: src.ctaLabel || '',
    ctaHref: src.ctaHref || '',
    mediaUrl: src.mediaUrl || '',
    mediaType: src.mediaType || 'none',
    sortOrder: src.sortOrder ?? 0,
    isActive: src.isActive !== false,
    eyebrow: src.config?.eyebrow || '',
    images: (src.config?.images || []).map((img) => ({ url: img.url || '', alt: img.alt || '', href: img.href || '' })),
  };
}

function toBody(form, updatedAt) {
  const { eyebrow, images, ...rest } = form;
  return {
    ...rest,
    sortOrder: Number(form.sortOrder) || 0,
    config: { eyebrow, images: images.filter((img) => img.url) },
    ...(updatedAt ? { expectedUpdatedAt: updatedAt } : {}),
  };
}

export function AdminHomepagePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-homepage'], queryFn: adminApi.homepage });
  const sections = data?.items || [];
  const [selected, setSelected] = useState(null);
  const active = sections.find((s) => s.key === selected) || sections[0];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Homepage CMS' }]}
        title="Homepage CMS"
        description="Edits are saved as drafts. The storefront only changes when you publish."
        actions={
          <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
            View homepage
          </a>
        }
      />
      {error ? <Notice tone="error">{error.message}</Notice> : null}
      {isLoading ? <p className="admin-muted">Loading sections…</p> : null}

      {active ? (
        <div className="admin-form-grid" style={{ gridTemplateColumns: 'minmax(200px, 260px) 1fr' }}>
          <nav className="admin-card admin-stack" aria-label="Homepage sections">
            {sections.map((s) => {
              const [tone, label] = statusOf(s);
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`admin-btn ${active.key === s.key ? 'admin-btn-primary' : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, width: '100%', height: 'auto', padding: '0.55rem 0.75rem', textAlign: 'left' }}
                  aria-current={active.key === s.key ? 'true' : undefined}
                  onClick={() => setSelected(s.key)}
                >
                  <span>{SECTION_SPEC[s.key]?.label || s.key}</span>
                  <span className={`admin-badge ${tone}`}>{label}</span>
                </button>
              );
            })}
          </nav>
          <SectionEditor key={`${active.key}-${active.updatedAt || 'new'}`} section={active} />
        </div>
      ) : null}

      <InstagramLinks />
      <HelpPages />
    </>
  );
}

function SectionEditor({ section }) {
  const qc = useQueryClient();
  const spec = SECTION_SPEC[section.key] || { label: section.key, fields: ['title', 'subtitle', 'body'] };
  const initial = toForm(section);
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const errors = {};
  if (!linkOk(form.ctaHref)) errors.ctaHref = 'Use a site path like /shop or a full https:// link.';
  if (form.images.some((img) => !linkOk(img.url) || !linkOk(img.href))) errors.gallery = 'Image and link URLs must be site paths or https:// links.';
  const invalid = Object.keys(errors).length > 0;

  const refresh = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: ['admin-homepage'] });
    qc.invalidateQueries({ queryKey: ['homepage'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const saveDraft = () => adminApi.patchHomepage(section.key, toBody(form, section.updatedAt));
  const save = useMutation({ mutationFn: saveDraft, onSuccess: () => refresh('Draft saved — not live yet.'), onError: fail });
  const publish = useMutation({
    mutationFn: async () => {
      if (dirty || !section.draft) await saveDraft();
      return adminApi.publishHomepage(section.key);
    },
    onSuccess: () => refresh('Published — live on the homepage.'),
    onError: fail,
  });
  const discard = useMutation({ mutationFn: () => adminApi.discardHomepage(section.key), onSuccess: () => refresh('Draft discarded.'), onError: fail });
  const busy = save.isPending || publish.isPending || discard.isPending;

  const setImage = (i, patch) => setForm((f) => ({ ...f, images: f.images.map((img, x) => (x === i ? { ...img, ...patch } : img)) }));

  const text = (key) => (
    <Field key={key} label={LABELS[key]} error={errors[key]} hint={spec.hints?.[key] || (form[key].length > LIMITS[key] * 0.8 ? `${form[key].length}/${LIMITS[key]}` : null)}>
      {(fid) =>
        key === 'body' || key === 'subtitle' ? (
          <textarea id={fid} rows={key === 'body' ? 4 : 2} maxLength={LIMITS[key]} value={form[key]} onChange={set(key)} />
        ) : (
          <input id={fid} maxLength={LIMITS[key]} value={form[key]} onChange={set(key)} />
        )
      }
    </Field>
  );

  return (
    <section className="admin-card">
      <div className="admin-page-head" style={{ marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{spec.label}</h2>
          <p className="admin-muted" style={{ margin: 0 }}>
            {section.publishedAt ? `Last published ${fmtDate(section.publishedAt)}.` : 'Never published — the storefront shows the built-in copy for this section.'}
            {section.draft ? ' A draft is waiting.' : ''}
          </p>
        </div>
        <div className="admin-page-actions">
          {section.draft ? (
            <button type="button" className="admin-btn" disabled={busy} onClick={() => window.confirm('Discard the unpublished draft?') && discard.mutate()}>
              Discard draft
            </button>
          ) : null}
          <button type="button" className="admin-btn" disabled={busy || invalid || !dirty} onClick={() => save.mutate()}>
            Save draft
          </button>
          <button type="button" className="admin-btn admin-btn-primary" disabled={busy || invalid} onClick={() => publish.mutate()}>
            {publish.isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {spec.note ? <p className="admin-muted">{spec.note}</p> : null}

      <div className="admin-row">
        <label className="admin-check">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Show this section
        </label>
        <Field label="Position" hint="Lower shows first">
          {(fid) => <input id={fid} type="number" min="0" max="100" value={form.sortOrder} onChange={set('sortOrder')} style={{ width: 90 }} />}
        </Field>
      </div>

      {spec.fields.map((key) => {
        if (LABELS[key]) return text(key);
        if (key === 'image') {
          return <ImageField key={key} label="Section image" value={form.mediaUrl} aspect="16 / 9" onChange={(url) => setForm((f) => ({ ...f, mediaUrl: url, mediaType: url ? 'image' : 'none' }))} />;
        }
        if (key === 'media') {
          return (
            <div key={key}>
              <Field label="Background">
                {(fid) => (
                  <select id={fid} value={form.mediaType} onChange={set('mediaType')}>
                    <option value="video">Video</option>
                    <option value="image">Image slideshow / still</option>
                    <option value="none">Built-in default</option>
                  </select>
                )}
              </Field>
              {form.mediaType === 'video' ? (
                <Field label="Video URL" hint="MP4 path such as /hero/dresses.mp4 or an https:// link">
                  {(fid) => <input id={fid} value={form.mediaUrl} onChange={set('mediaUrl')} />}
                </Field>
              ) : form.mediaType === 'image' ? (
                <ImageField label="Hero image" value={form.mediaUrl} aspect="16 / 9" onChange={(url) => setForm((f) => ({ ...f, mediaUrl: url }))} />
              ) : null}
            </div>
          );
        }
        if (key === 'gallery') {
          return (
            <div key={key} className="admin-field">
              <label>Editorial images (up to 6)</label>
              {errors.gallery ? <span className="admin-field-error">{errors.gallery}</span> : null}
              <div className="admin-row">
                {form.images.map((img, i) => (
                  <div key={i} className="admin-card admin-stack">
                    <ImageField label={`Image ${i + 1}`} value={img.url} aspect="4 / 5" onChange={(url) => setImage(i, { url })} />
                    <Field label="Alt text">{(fid) => <input id={fid} value={img.alt} maxLength={160} onChange={(e) => setImage(i, { alt: e.target.value })} />}</Field>
                    <Field label="Post link">{(fid) => <input id={fid} value={img.href} placeholder="https://instagram.com/p/…" onChange={(e) => setImage(i, { href: e.target.value })} />}</Field>
                    <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, x) => x !== i) }))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {form.images.length < 6 ? (
                <button type="button" className="admin-btn" onClick={() => setForm((f) => ({ ...f, images: [...f.images, { url: '', alt: '', href: '' }] }))}>
                  Add image
                </button>
              ) : null}
              <span className="admin-field-hint">Leave empty to use the brand lookbook images.</span>
            </div>
          );
        }
        return null;
      })}
    </section>
  );
}

function InstagramLinks() {
  const home = useQuery({ queryKey: ['homepage'], queryFn: catalogApi.homepage });
  const current = (home.data?.instagram?.links || []).map((l) => l.url).join('\n');
  return home.isLoading ? null : <InstagramLinksForm key={current} initial={current} />;
}

function InstagramLinksForm({ initial }) {
  const qc = useQueryClient();
  const [ig, setIg] = useState(initial);
  const [msg, setMsg] = useState(null);
  const urls = ig.split('\n').map((u) => u.trim()).filter(Boolean);
  const bad = urls.find((u) => !/^https?:\/\//i.test(u));
  const save = useMutation({
    mutationFn: () => adminApi.setHomepageInstagram(urls.map((url) => ({ url }))),
    onSuccess: () => {
      setMsg({ tone: 'ok', text: 'Instagram links saved.' });
      qc.invalidateQueries({ queryKey: ['homepage'] });
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });
  return (
    <section className="admin-card" style={{ marginTop: '1rem' }}>
      <h2>Instagram post links</h2>
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      <Field label="Post URLs" error={bad ? `Not a valid link: ${bad}` : null} hint="One per line, in tile order. Tiles without an editorial image link here.">
        {(fid) => <textarea id={fid} rows={4} value={ig} onChange={(e) => setIg(e.target.value)} />}
      </Field>
      <button type="button" className="admin-btn" disabled={Boolean(bad) || save.isPending} onClick={() => save.mutate()}>
        Save links
      </button>
    </section>
  );
}

function HelpPages() {
  const [slug, setSlug] = useState(PAGE_SLUGS[0]);
  const page = useQuery({ queryKey: ['admin-page', slug], queryFn: () => adminApi.page(slug) });
  return (
    <section className="admin-card" style={{ marginTop: '1rem' }}>
      <h2>Brand &amp; help pages</h2>
      <Field label="Page">
        {(fid) => (
          <select id={fid} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {PAGE_SLUGS.map((s) => (
              <option key={s} value={s}>
                /{s}
              </option>
            ))}
          </select>
        )}
      </Field>
      {page.isLoading ? <p className="admin-muted">Loading…</p> : <PageForm key={`${slug}-${page.data?.updatedAt || ''}`} slug={slug} page={page.data} />}
    </section>
  );
}

function PageForm({ slug, page }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: page?.title || '', body: page?.body || '' });
  const [msg, setMsg] = useState(null);
  const save = useMutation({
    mutationFn: () => adminApi.upsertPage(slug, form),
    onSuccess: () => {
      setMsg({ tone: 'ok', text: `/${slug} saved.` });
      qc.invalidateQueries({ queryKey: ['admin-page', slug] });
      qc.invalidateQueries({ queryKey: ['page', slug] });
    },
    onError: (e) => setMsg({ tone: 'error', text: e.message }),
  });
  return (
    <>
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {!page ? <p className="admin-muted">This page doesn&apos;t exist yet — saving creates it.</p> : null}
      <Field label="Title">{(fid) => <input id={fid} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}</Field>
      <Field label="Body">{(fid) => <textarea id={fid} rows={10} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />}</Field>
      <button type="button" className="admin-btn admin-btn-primary" disabled={!form.title.trim() || save.isPending} onClick={() => save.mutate()}>
        Save page
      </button>
    </>
  );
}
