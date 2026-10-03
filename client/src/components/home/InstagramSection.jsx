import { mood } from '../../lib/media';

export function InstagramSection({ links }) {
  const fallback = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com';
  const tiles = mood.grid.slice(0, 6).map((src, i) => ({
    id: links?.[i]?.id || `mood-ig-${i}`,
    url: links?.[i]?.url || fallback,
    thumbUrl: src,
    caption: links?.[i]?.caption,
  }));

  return (
    <section className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[length:var(--text-2xl)] font-semibold md:text-[length:var(--text-3xl)]">
            THE RUUX, OUT THERE.
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Real posts. Real attitude. Follow the feed.
          </p>
        </div>
        <a
          href={import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com'}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium uppercase tracking-[var(--tracking-caps)] underline-offset-4 hover:underline"
        >
          FOLLOW @THERUUX →
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        {tiles.map((tile) => (
          <a
            key={tile.id}
            href={tile.url}
            target="_blank"
            rel="noreferrer"
            className="aspect-square overflow-hidden bg-[var(--color-bg-muted)]"
          >
            <img
              src={tile.thumbUrl || mood.hero}
              alt={tile.caption || 'TheRuux on Instagram'}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
