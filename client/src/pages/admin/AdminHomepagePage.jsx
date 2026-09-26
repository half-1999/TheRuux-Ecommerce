import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';

const PAGE_SLUGS = [
  'about-us',
  'our-story',
  'size-guide',
  'shipping-delivery',
  'returns-exchanges',
  'faqs',
  'contact',
  'privacy',
  'terms',
];

function SectionEditor({ section, onSaved }) {
  const [form, setForm] = useState({
    title: section.title || '',
    subtitle: section.subtitle || '',
    body: section.body || '',
    ctaLabel: section.ctaLabel || '',
    ctaHref: section.ctaHref || '',
    mediaUrl: section.mediaUrl || '',
    mediaType: section.mediaType || 'none',
    isActive: section.isActive !== false,
  });

  const save = useMutation({
    mutationFn: () => adminApi.patchHomepage(section.key, form),
    onSuccess: onSaved,
  });

  return (
    <div className="admin-card">
      <p className="admin-metric-label">Edit · {section.key}</p>
      {['title', 'subtitle', 'ctaLabel', 'ctaHref', 'mediaUrl'].map((key) => (
        <div className="admin-field" key={key}>
          <label>{key}</label>
          <input value={form[key] || ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div className="admin-field">
        <label>body</label>
        <textarea value={form.body || ''} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
      </div>
      <div className="admin-field">
        <label>mediaType</label>
        <select
          value={form.mediaType || 'none'}
          onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value }))}
        >
          <option value="none">none</option>
          <option value="image">image</option>
          <option value="video">video</option>
        </select>
      </div>
      <label className="admin-muted" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <input
          type="checkbox"
          checked={form.isActive !== false}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        Active
      </label>
      <button type="button" className="admin-btn admin-btn-primary" onClick={() => save.mutate()}>
        Save section
      </button>
      {save.error ? <p className="admin-error">{save.error.message}</p> : null}
    </div>
  );
}

export function AdminHomepagePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-homepage'], queryFn: adminApi.homepage });
  const sections = data?.items || [];
  const [selected, setSelected] = useState(null);
  const activeKey = selected || sections[0]?.key || null;
  const activeSection = sections.find((s) => s.key === activeKey);

  const [ig, setIg] = useState('');
  const [pageSlug, setPageSlug] = useState('about-us');
  const [pageForm, setPageForm] = useState({ title: '', body: '' });
  const [msg, setMsg] = useState('');

  const saveIg = useMutation({
    mutationFn: () =>
      adminApi.setHomepageInstagram(
        ig
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url) => ({ url })),
      ),
    onSuccess: () => setMsg('Homepage Instagram updated.'),
    onError: (e) => setMsg(e.message),
  });

  const loadPage = useMutation({
    mutationFn: () => adminApi.page(pageSlug),
    onSuccess: (page) => {
      setPageForm({ title: page?.title || '', body: page?.body || '' });
    },
  });

  const savePage = useMutation({
    mutationFn: () => adminApi.upsertPage(pageSlug, pageForm),
    onSuccess: () => setMsg(`Page ${pageSlug} saved.`),
    onError: (e) => setMsg(e.message),
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Homepage CMS</h1>
      </div>
      {msg ? <p className="admin-muted">{msg}</p> : null}
      {isLoading ? <p>Loading…</p> : null}

      <div className="admin-row">
        <div className="admin-card">
          <p className="admin-metric-label">Sections</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`admin-btn ${activeKey === s.key ? 'admin-btn-primary' : ''}`}
                onClick={() => setSelected(s.key)}
              >
                {s.key}
              </button>
            ))}
          </div>
        </div>
        {activeSection ? (
          <SectionEditor
            key={activeSection.key + String(activeSection.updatedAt || '')}
            section={activeSection}
            onSaved={() => {
              setMsg('Section saved.');
              qc.invalidateQueries({ queryKey: ['admin-homepage'] });
            }}
          />
        ) : (
          <div className="admin-card">
            <p className="admin-muted">Select a section</p>
          </div>
        )}
      </div>

      <div className="admin-card" style={{ marginTop: '1rem' }}>
        <p className="admin-metric-label">Homepage Instagram URLs</p>
        <textarea
          style={{ width: '100%', marginTop: '0.5rem' }}
          rows={4}
          placeholder="One URL per line"
          value={ig}
          onChange={(e) => setIg(e.target.value)}
        />
        <button type="button" className="admin-btn" style={{ marginTop: '0.5rem' }} onClick={() => saveIg.mutate()}>
          Replace IG list
        </button>
      </div>

      <div className="admin-card" style={{ marginTop: '1rem' }}>
        <p className="admin-metric-label">Help / brand pages</p>
        <div className="admin-toolbar" style={{ marginTop: '0.5rem' }}>
          <select value={pageSlug} onChange={(e) => setPageSlug(e.target.value)}>
            {PAGE_SLUGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="admin-btn" onClick={() => loadPage.mutate()}>
            Load
          </button>
        </div>
        <div className="admin-field">
          <label>Title</label>
          <input value={pageForm.title} onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="admin-field">
          <label>Body</label>
          <textarea value={pageForm.body} onChange={(e) => setPageForm((f) => ({ ...f, body: e.target.value }))} />
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => savePage.mutate()}>
          Save page
        </button>
      </div>
    </>
  );
}
