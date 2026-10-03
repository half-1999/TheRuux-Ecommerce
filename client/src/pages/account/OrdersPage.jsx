import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/client';
import { formatInr } from '../../lib/media';
import { orderStatusLabel } from '../../lib/orderStatus';
import { Skeleton } from '../../components/ui';

export function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!data?.items?.length) {
    return <p className="text-[var(--color-text-muted)]">No orders yet.</p>;
  }

  return (
    <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
      {data.items.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <Link to={`/account/orders/${o.orderNumber}`} className="font-medium underline-offset-2 hover:underline">
              {o.orderNumber}
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              {orderStatusLabel(o.status)} · {o.paymentStatus}
            </p>
          </div>
          <p className="text-sm font-medium">{formatInr(o.grandTotal)}</p>
        </li>
      ))}
    </ul>
  );
}
