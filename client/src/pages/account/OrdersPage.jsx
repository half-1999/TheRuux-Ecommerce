import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/client';
import { formatInr } from '../../lib/media';
import { formatOrderDate, orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';
import { Skeleton } from '../../components/ui';

function moneyOrFree(value) {
  return Number(value) ? formatInr(value) : 'Free';
}

export function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!data?.items?.length) {
    return <p className="text-[var(--color-text-muted)]">No orders yet.</p>;
  }

  return (
    <ul className="space-y-6 pb-16">
      {data.items.map((order) => (
        <li key={order.id} className="border border-[var(--color-border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                to={`/account/orders/${order.orderNumber}`}
                className="text-lg font-semibold underline-offset-2 hover:underline"
              >
                {order.orderNumber}
              </Link>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Placed {formatOrderDate(order.placedAt)}
              </p>
              {order.paidAt ? (
                <p className="text-sm text-[var(--color-text-muted)]">Paid {formatOrderDate(order.paidAt)}</p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium">{formatInr(order.grandTotal)}</p>
              <p className="mt-1 text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                {order.itemCount} {order.itemCount === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[var(--tracking-caps)]">
            <span className="border border-[var(--color-border)] px-2 py-1">{orderStatusLabel(order.status)}</span>
            <span className="border border-[var(--color-border)] px-2 py-1">
              Payment {paymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
          {order.statusReason ? (
            <p className="mt-3 max-w-xl text-sm text-[var(--color-text-muted)]">{order.statusReason}</p>
          ) : null}

          <ul className="mt-5 space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-20 w-16 shrink-0 object-cover" />
                ) : (
                  <div className="h-20 w-16 shrink-0 bg-[var(--color-bg-muted)]" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.productTitle ? (
                    <p className="text-sm text-[var(--color-text-muted)]">{item.productTitle}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                    {[item.colourName, item.size].filter(Boolean).join(' / ')}
                    {item.quantity ? ` · Qty ${item.quantity}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Payment
              </dt>
              <dd className="mt-1">
                {order.paymentLabel || '—'}
                {order.paymentDetail ? ` · ${order.paymentDetail}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Shipping
              </dt>
              <dd className="mt-1">
                {order.shippingLabel || '—'}
                {order.shippingEstimate ? ` · ${order.shippingEstimate}` : ''}
                {` · ${moneyOrFree(order.shipping)}`}
              </dd>
            </div>
            {order.trackingNumber ? (
              <div>
                <dt className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                  Tracking
                </dt>
                <dd className="mt-1">
                  {order.carrier ? `${order.carrier} · ` : ''}
                  {order.trackingNumber}
                </dd>
              </div>
            ) : null}
          </dl>

          <Link to={`/account/orders/${order.orderNumber}`} className="mt-5 inline-block text-sm underline">
            View order
          </Link>
        </li>
      ))}
    </ul>
  );
}
