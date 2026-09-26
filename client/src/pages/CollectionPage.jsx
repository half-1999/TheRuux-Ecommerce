import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { catalogApi } from '../api/client';
import { ProductGrid } from '../components/product/ProductGrid';
import { mood } from '../lib/media';

export function CollectionPage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['collection', slug],
    queryFn: () => catalogApi.collection(slug),
  });

  return (
    <div>
      <section className="relative min-h-[50vh] overflow-hidden bg-[var(--color-bg-inverse)] text-white">
        <img
          src={data?.heroMediaUrl || mood.udbhav}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="relative z-10 mx-auto flex min-h-[50vh] max-w-[var(--container)] flex-col justify-end px-[var(--space-header-x)] pb-12 pt-28">
          <p className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-white/60">Collection</p>
          <h1 className="mt-2 text-[length:var(--text-display)] font-semibold">{data?.name || slug}</h1>
          {data?.conceptLine ? (
            <p className="mt-3 font-[family-name:var(--font-script)] text-4xl text-[var(--color-brand-subtle)]">
              {data.conceptLine}
            </p>
          ) : null}
          {data?.story ? <p className="mt-4 max-w-xl text-sm text-white/75">{data.story}</p> : null}
        </div>
      </section>
      <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]">
        <div className="mb-8 text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          <Link to="/">Home</Link>
          <span className="mx-2">/</span>
          <span>{data?.name || 'Collection'}</span>
        </div>
        <ProductGrid products={data?.products} loading={isLoading} />
      </div>
    </div>
  );
}
