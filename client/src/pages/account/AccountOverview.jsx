import { Link } from 'react-router-dom';

export function AccountOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { to: '/account/orders', title: 'Orders', body: 'Track and revisit purchases.' },
        { to: '/account/wishlist', title: 'Wishlist', body: 'Pieces you saved.' },
        { to: '/account/addresses', title: 'Addresses', body: 'Shipping destinations.' },
      ].map((card) => (
        <Link
          key={card.to}
          to={card.to}
          className="border border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-border-strong)]"
        >
          <p className="font-semibold">{card.title}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{card.body}</p>
        </Link>
      ))}
    </div>
  );
}
