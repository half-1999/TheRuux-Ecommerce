import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { catalogApi } from '../api/client';
import { ProductGrid } from '../components/product/ProductGrid';

export function ShopPage({ mode = 'all' }) {
  const { category } = useParams();

  const query = useQuery({
    queryKey: ['products', mode, category],
    queryFn: async () => {
      if (mode === 'category' && category) {
        return catalogApi.category(category);
      }
      if (mode === 'new') {
        const d = await catalogApi.newArrivals(24);
        return { items: Array.isArray(d) ? d : d.items || [] };
      }
      if (mode === 'bestsellers') {
        const d = await catalogApi.bestsellers(24);
        return { items: Array.isArray(d) ? d : d.items || [] };
      }
      return catalogApi.products({ pageSize: 48, sort: 'newest' });
    },
  });

  const title =
    mode === 'category'
      ? query.data?.category?.name || category
      : mode === 'new'
        ? 'New Arrivals'
        : mode === 'bestsellers'
          ? 'Bestsellers'
          : 'Shop All';

  return (
    <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-28">
      <nav className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        <Link to="/" className="hover:text-[var(--color-text)]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </nav>
      <h1 className="mt-4 text-[length:var(--text-display)] font-semibold leading-none">{title}</h1>
      <div className="mt-10">
        <ProductGrid products={query.data?.items} loading={query.isLoading} />
      </div>
    </div>
  );
}
