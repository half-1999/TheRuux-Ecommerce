import { useWishlist } from '../../hooks/useWishlist';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Link } from 'react-router-dom';

export function WishlistPage() {
  const { data, isLoading } = useWishlist();

  if (!isLoading && !data?.items?.length) {
    return (
      <div>
        <p className="text-lg font-semibold tracking-wide">NOTHING HERE YET.</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Save pieces you love. 🖤</p>
        <Link to="/shop" className="mt-6 inline-block text-sm underline">
          Explore the shop
        </Link>
      </div>
    );
  }

  return <ProductGrid products={data?.items} loading={isLoading} />;
}
