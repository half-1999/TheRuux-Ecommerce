import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Skeleton } from '../ui/Skeleton';
import { staggerContainer } from '../../animations/motion';

export function ProductGrid({ products, loading, empty = 'WE LOOKED. NOTHING.' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-[var(--space-card-gap)] md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold tracking-wide">{empty}</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Try something else.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-[var(--space-card-gap)] md:grid-cols-3 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-40px' }}
    >
      {products.map((p) => (
        <ProductCard key={p.id || p.slug} product={p} />
      ))}
    </motion.div>
  );
}
