import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatInr } from '../lib/media';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.get(orderNumber),
    enabled: Boolean(user && orderNumber),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-xl px-[var(--space-header-x)] pb-24 pt-28 text-center">
      <p className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Order confirmed
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-wide">GOOD CHOICE.</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">We&apos;ll handle the rest. 📦</p>
      <p className="mt-8 text-sm">
        Order <span className="font-medium">{orderNumber}</span>
      </p>
      {data?.grandTotal ? (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Total {formatInr(data.grandTotal)}</p>
      ) : null}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/shop"
          className="inline-flex min-h-11 items-center bg-[#141414] px-5 text-sm text-[#F5F2EC]"
        >
          Keep shopping
        </Link>
        {user ? (
          <Link to="/account/orders" className="inline-flex min-h-11 items-center px-5 text-sm underline">
            View orders
          </Link>
        ) : null}
      </div>
    </div>
  );
}
