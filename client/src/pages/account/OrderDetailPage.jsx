import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/client';
import { formatInr } from '../../lib/media';
import { orderStatusLabel } from '../../lib/orderStatus';

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.get(orderNumber),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) {
    return (
      <p>
        Order not found. <Link to="/account/orders">Back</Link>
      </p>
    );
  }

  return (
    <div>
      <Link to="/account/orders" className="text-sm underline">
        ← Orders
      </Link>
      <h2 className="mt-4 text-2xl font-semibold">{data.orderNumber}</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {orderStatusLabel(data.status)} · {data.paymentStatus}
        {data.paymentMethod ? ` · ${data.paymentMethod}` : ''}
        {data.shippingMethodId ? ` · ${data.shippingMethodId}` : ''}
      </p>
      <ul className="mt-8 space-y-4">
        {data.items?.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>
              {item.productName} — {item.productTitle}
              <span className="block text-[var(--color-text-subtle)]">
                {item.size} / {item.colourName} × {item.quantity}
              </span>
            </span>
            <span>{formatInr(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 font-medium">Total {formatInr(data.grandTotal)}</p>
    </div>
  );
}
