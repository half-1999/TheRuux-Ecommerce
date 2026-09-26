import { Link } from 'react-router-dom';
import { mood } from '../../lib/media';

const FALLBACK = [
  { name: 'Shirts', slug: 'shirts', image: mood.categoryShirts },
  { name: 'T-Shirts', slug: 't-shirts', image: mood.categoryTees },
  { name: 'Bottoms', slug: 'bottoms', image: mood.categoryBottoms },
  { name: 'Sets', slug: 'sets', image: mood.categorySets },
];

export function CategoriesSection({ categories }) {
  const tiles =
    categories?.length > 0
      ? categories.map((c, i) => ({
          name: c.name,
          slug: c.slug,
          // REPLACE: category packshots
          image: c.imageUrl || FALLBACK[i % FALLBACK.length].image,
        }))
      : FALLBACK;

  return (
    <section className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]">
      <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Shop by Category
      </p>
      <h2 className="mt-2 text-[length:var(--text-2xl)] font-semibold md:text-[length:var(--text-3xl)]">
        Find your silhouette.
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            to={`/shop/${tile.slug}`}
            className="group relative aspect-square overflow-hidden bg-[var(--color-bg-muted)]"
          >
            <img
              src={tile.image}
              alt={tile.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="absolute bottom-4 left-4 text-sm font-semibold uppercase tracking-[var(--tracking-caps)] text-white">
              {tile.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
