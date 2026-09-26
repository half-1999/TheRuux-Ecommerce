import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/client';
import { ProductGrid } from '../components/product/ProductGrid';
import { Input } from '../components/ui';

export function SearchPage() {
  const [params] = useSearchParams();
  const initial = params.get('q') || '';
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['search', initial],
    queryFn: () => catalogApi.search(initial),
    enabled: Boolean(initial),
  });

  return (
    <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-28">
      <h1 className="text-3xl font-semibold">Search</h1>
      <form
        key={initial}
        className="mt-8 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(e.currentTarget.elements.namedItem('q')?.value || '').trim();
          navigate(`/search?q=${encodeURIComponent(value)}`);
        }}
      >
        <Input label="Looking for" name="q" defaultValue={initial} placeholder="Name, title…" />
      </form>
      <div className="mt-10">
        {!initial ? (
          <p className="text-[var(--color-text-muted)]">Type something and hit enter.</p>
        ) : (
          <ProductGrid products={data?.items} loading={isFetching} empty="WE LOOKED. NOTHING." />
        )}
      </div>
      {initial && !isFetching && data?.items?.length === 0 ? (
        <Link to="/shop" className="mt-6 inline-block text-sm underline">
          Browse Shop All
        </Link>
      ) : null}
    </div>
  );
}
