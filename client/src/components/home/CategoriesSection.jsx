import { Link } from 'react-router-dom';
import shirts from '../../assets/categories/shirts.jpg';
import tees from '../../assets/categories/t-shirts.jpg';
import bottoms from '../../assets/categories/bottoms.jpg';
import sets from '../../assets/categories/sets.jpg';

/** Public Unsplash stills (free to use). Placeholders from the API print the name again, so tiles always use these. */
const LOOKS = {
  shirts: {
    name: 'Shirts',
    image: shirts,
    line: 'Zip, collar, structure.',
  },
  't-shirts': {
    name: 'T-Shirts',
    image: tees,
    line: 'Oversized, graphic, easy.',
  },
  bottoms: {
    name: 'Bottoms',
    image: bottoms,
    line: 'Denim with a point of view.',
  },
  sets: {
    name: 'Sets',
    image: sets,
    line: 'Shirt and shorts, one look.',
  },
};

const ORDER = ['shirts', 't-shirts', 'bottoms', 'sets'];

export function CategoriesSection({ categories }) {
  const bySlug = Object.fromEntries((categories || []).map((c) => [c.slug, c]));
  const tiles = ORDER.map((slug) => {
    const look = LOOKS[slug];
    const fromApi = bySlug[slug];
    return {
      slug,
      name: fromApi?.name || look.name,
      image: look.image,
      line: look.line,
    };
  });

  return (
    <section className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]">
      <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Shop by Category
      </p>
      <h2 className="mt-2 max-w-xl text-[length:var(--text-2xl)] font-semibold leading-tight md:text-[length:var(--text-3xl)]">
        Find your silhouette.
      </h2>
      <p className="mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
        Four cuts. One attitude. Pick the shape, then the piece.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            to={`/shop/${tile.slug}`}
            className="group relative block overflow-hidden bg-[var(--color-bg-muted)]"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={tile.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.05]"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-[#F5F2EC] md:p-5">
              <p className="text-sm font-semibold uppercase tracking-[var(--tracking-caps)]">
                {tile.name}
              </p>
              <p className="mt-1 text-xs text-white/75">{tile.line}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
