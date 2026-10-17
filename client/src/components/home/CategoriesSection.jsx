import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { prefersReducedMotion } from '../../animations/motion';
import shirts from '../../assets/categories/shirts.jpg';
import tees from '../../assets/categories/t-shirts.jpg';
import bottoms from '../../assets/categories/bottoms.jpg';
import sets from '../../assets/categories/sets.jpg';

/** Bundled stills for the launch categories, used until a real category image is uploaded. */
const LOOKS = {
  shirts: { image: shirts, line: 'Zip, collar, structure.' },
  't-shirts': { image: tees, line: 'Oversized, graphic, easy.' },
  bottoms: { image: bottoms, line: 'Denim with a point of view.' },
  sets: { image: sets, line: 'Shirt and shorts, one look.' },
};

// Seeded imageUrls are placehold.co cards that just print the name again.
const realImage = (url) => (url && !/placehold\.co/i.test(url) ? url : '');

function Tile({ category, index, total }) {
  const look = LOOKS[category.slug];
  const [failed, setFailed] = useState(false);
  const image = !failed && (realImage(category.imageUrl) || look?.image);
  const line = category.description || look?.line || '';

  return (
    <li className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-3*1.25rem)/4)]" aria-roledescription="slide" aria-label={`${index + 1} of ${total}: ${category.name}`}>
      <Link
        to={`/shop/${category.slug}`}
        className="group relative block overflow-hidden bg-[var(--color-bg-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
      >
        <div className="aspect-[3/4] overflow-hidden">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.05]"
            />
          ) : (
            // Brand tile for categories that have no photography yet.
            <div className="flex h-full w-full items-center justify-center bg-[var(--color-brand)]">
              <span className="font-[family-name:var(--font-script)] text-7xl leading-none text-[var(--color-brand-subtle)]">{category.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-[#F5F2EC] md:p-5">
          <p className="text-sm font-semibold uppercase tracking-[var(--tracking-caps)]">{category.name}</p>
          {line ? <p className="mt-1 line-clamp-2 text-xs text-white/75">{line}</p> : null}
        </div>
      </Link>
    </li>
  );
}

export function CategoriesSection({ categories, loading, copy }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const items = categories || [];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
    };
    const ro = new window.ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [items.length]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  if (!loading && !items.length) return null;
  const overflowing = !(edges.start && edges.end);

  return (
    <section
      className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]"
      aria-roledescription="carousel"
      aria-labelledby="categories-heading"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            {copy?.config?.eyebrow || 'Shop by Category'}
          </p>
          <h2 id="categories-heading" className="mt-2 max-w-xl text-[length:var(--text-2xl)] font-semibold leading-tight md:text-[length:var(--text-3xl)]">
            {copy?.title || 'Find your silhouette.'}
          </h2>
          <p className="mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
            {copy?.subtitle || 'Every cut, one attitude. Pick the shape, then the piece.'}
          </p>
        </div>
        {overflowing ? (
          <div className="flex gap-2">
            {[
              [-1, 'Previous categories', CaretLeft, edges.start],
              [1, 'Next categories', CaretRight, edges.end],
            ].map(([dir, label, Icon, disabled]) => (
              <button
                key={dir}
                type="button"
                aria-label={label}
                aria-controls="categories-track"
                disabled={disabled}
                onClick={() => scrollBy(dir)}
                className="inline-flex h-11 w-11 items-center justify-center border border-[var(--color-border-strong)] transition-colors hover:bg-[var(--color-brand)] hover:text-[#F5F2EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
              >
                <Icon size={18} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <ul
        id="categories-track"
        ref={trackRef}
        tabIndex={0}
        aria-label="Categories"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'ArrowRight') scrollBy(1);
          if (e.key === 'ArrowLeft') scrollBy(-1);
        }}
        className="mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand)] md:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {loading && !items.length
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="aspect-[3/4] w-[72%] shrink-0 animate-pulse bg-[var(--color-bg-muted)] sm:w-[44%] lg:w-[calc((100%-3*1.25rem)/4)]" aria-hidden />
            ))
          : items.map((c, i) => <Tile key={c.id || c.slug} category={c} index={i} total={items.length} />)}
      </ul>
    </section>
  );
}
