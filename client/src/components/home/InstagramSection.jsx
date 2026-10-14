import { InstagramLogo } from '@phosphor-icons/react';
import { mood } from '../../lib/media';

/** Editorial columns: [tile indexes, column width, top offset, aspect per tile]. */
const COLUMNS = [
  { tiles: [0, 5], width: 'md:w-5/12', offset: '', aspects: ['aspect-[4/5]', 'aspect-[16/10]'] },
  { tiles: [1, 2], width: 'md:w-4/12', offset: 'md:pt-20', aspects: ['aspect-[3/4]', 'aspect-square'] },
  { tiles: [3, 4], width: 'md:w-3/12', offset: 'md:pt-8', aspects: ['aspect-[2/3]', 'aspect-[4/5]'] },
];

export function InstagramSection({ links, copy }) {
  const profile = copy?.ctaHref || import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com';
  const images = copy?.config?.images?.length ? copy.config.images : mood.grid.map((url) => ({ url, alt: '' }));
  const tiles = Array.from({ length: 6 }, (_, i) => {
    const img = images[i % images.length];
    return {
      url: img.url,
      alt: img.alt || links?.[i]?.caption || 'TheRuux, styled and out in the world',
      href: img.href || links?.[i]?.url || profile,
    };
  });

  return (
    <section className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]" aria-labelledby="ig-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">On Instagram</p>
          <h2 id="ig-heading" className="mt-2 text-[length:var(--text-2xl)] font-semibold leading-[1.02] md:text-[length:var(--text-display)]">
            {copy?.title || 'THE RUUX, OUT THERE.'}
          </h2>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">{copy?.subtitle || 'Real posts. Real attitude. Follow the feed.'}</p>
        </div>
        <a
          href={profile}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 border border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-medium uppercase tracking-[var(--tracking-caps)] transition-colors hover:bg-[var(--color-brand)] hover:text-[#F5F2EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        >
          <InstagramLogo size={18} aria-hidden />
          {copy?.ctaLabel || 'Follow @theruux'}
        </a>
      </div>

      <div className="mt-10 flex flex-col gap-3 md:flex-row md:gap-5">
        {COLUMNS.map((col) => (
          <div key={col.tiles.join()} className={`grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-5 ${col.width} ${col.offset}`}>
            {col.tiles.map((t, i) => {
              const tile = tiles[t];
              return (
                <a
                  key={t}
                  href={tile.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${tile.alt} — open on Instagram`}
                  className={`group relative block overflow-hidden bg-[var(--color-bg-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] ${col.aspects[i]}`}
                >
                  <img
                    src={tile.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 font-mono text-[10px] tracking-[0.2em] text-white/80 mix-blend-difference">
                    {String(t + 1).padStart(2, '0')}
                  </span>
                  <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/55 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <InstagramLogo size={20} className="text-white" aria-hidden />
                  </span>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
