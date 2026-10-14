import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { catalogApi } from '../api/client';
import { mood } from '../lib/media';
import { Button, Input } from '../components/ui';
import { useState } from 'react';
import { useToastStore } from '../store/toastStore';

const SLUG_MAP = {
  'size-guide': 'size-guide',
  shipping: 'shipping-delivery',
  returns: 'returns-exchanges',
  faqs: 'faqs',
  privacy: 'privacy',
  terms: 'terms',
  'about-us': 'about-us',
  'our-story': 'our-story',
  contact: 'contact',
};

export function CmsPage({ slug: slugProp, title: titleProp }) {
  const params = useParams();
  const raw = slugProp || params.slug;
  const apiSlug = SLUG_MAP[raw] || raw;
  const { data, isLoading } = useQuery({
    queryKey: ['page', apiSlug],
    queryFn: () => catalogApi.page(apiSlug),
    retry: false,
  });

  const title = data?.title || titleProp || raw?.replace(/-/g, ' ');
  const body = data?.body;
  const hasBanner = apiSlug === 'about-us' || apiSlug === 'our-story';

  return (
    <div className="min-h-[70svh]">
      {hasBanner && (
        // Explicit height: the image is absolutely positioned, and the fixed header overlaps the top.
        <section className="relative isolate flex min-h-[58svh] items-end overflow-hidden bg-[var(--color-bg-inverse)] pt-[calc(var(--header-height)+1.5rem)] md:min-h-[68svh]">
          {/* REPLACE: brand story photography */}
          <img src={mood.about} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_20%]" fetchPriority="high" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/35 to-black/45" aria-hidden />
          <div className="mx-auto w-full max-w-[var(--container)] px-[var(--space-header-x)] pb-10 text-[#F5F2EC] md:pb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-white/60">TheRuux</p>
            <h1 className="mt-3 max-w-3xl text-[length:var(--text-display)] font-semibold leading-none">{title}</h1>
          </div>
        </section>
      )}
      <div className={`mx-auto max-w-[var(--container-narrow)] px-[var(--space-header-x)] pb-24 ${hasBanner ? 'pt-12 md:pt-16' : 'pt-50'}`}>
        {!hasBanner ? (
          <>
            <nav className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              <Link to="/">Home</Link>
              <span className="mx-2">/</span>
              <span>{title}</span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{title}</h1>
          </>
        ) : null}
        {isLoading ? (
          <p className="mt-8 text-[var(--color-text-muted)]">Loading…</p>
        ) : (
          <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-[var(--color-text-muted)]">
            {body || 'Content coming soon.'}
          </div>
        )}
        {apiSlug === 'size-guide' ? (
          <p className="mt-8 font-semibold tracking-wide">DON&apos;T GUESS YOUR SIZE.</p>
        ) : null}
      </div>
    </div>
  );
}

export function ContactPage() {
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto min-h-[70svh] max-w-[var(--container-narrow)] px-[var(--space-header-x)] pt-50 pb-24">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">We read every note.</p>
      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await catalogApi.contact(form);
            setForm({ name: '', email: '', message: '' });
            push({ title: 'Message sent.' });
          } catch (err) {
            push({ title: 'Could not send', message: err.message });
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-muted)]">
            Message
          </span>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="border border-[var(--color-border)] bg-transparent p-3 outline-none focus:border-[var(--color-brand)]"
          />
        </label>
        <Button type="submit" loading={loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
