import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatInr } from '../lib/media';

const SHIPPING_LABEL = {
  standard: 'Standard · 3–5 business days',
  express: 'Express · 1–2 business days',
};

function readSnapshot(orderNumber) {
  try {
    return JSON.parse(window.sessionStorage.getItem(`theruux-order-${orderNumber}`) || 'null');
  } catch {
    return null;
  }
}

function isCashOnDelivery(order) {
  if (!order) return false;
  if (order.paymentMethod === 'cod') return true;
  return order.status === 'PROCESSING' && order.paymentStatus === 'PENDING';
}

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const user = useAuthStore((s) => s.user);
  const snapshot = readSnapshot(orderNumber);
  const { data, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.get(orderNumber),
    enabled: Boolean(user && orderNumber),
    retry: false,
  });

  const order = data
    ? { ...snapshot, ...data, paymentMethod: data.paymentMethod || snapshot?.paymentMethod }
    : snapshot;
  const cash = isCashOnDelivery(order);
  const address = order?.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-header-x)] pb-24 pt-50">
      <p className="text-[11px] uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Order confirmed
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-wide">GOOD CHOICE.</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {cash ? 'Pay with cash when the order arrives.' : "We'll handle the rest."}
      </p>

      <div className="mt-10 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-left">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              Order number
            </p>
            <p className="mt-1 text-lg font-semibold">{order?.orderNumber || orderNumber}</p>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {order?.placedAt ? <p>{formatWhen(order.placedAt)}</p> : null}
            {order?.status ? <p className="mt-1 uppercase tracking-[var(--tracking-caps)]">{order.status}</p> : null}
          </div>
        </div>

        {user && isLoading && !order ? <p className="mt-6 text-sm text-[var(--color-text-muted)]">Loading order…</p> : null}

        {order ? (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                  Contact
                </p>
                <p className="mt-2 text-sm">{address?.fullName || user?.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{order.email}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                  Shipping address
                </p>
                {address ? (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                  Shipping
                </p>
                <p className="mt-2 text-sm">
                  {SHIPPING_LABEL[order.shippingMethodId] || order.shippingMethodId || 'Standard'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                  Payment
                </p>
                <p className="mt-2 text-sm">
                  {cash ? 'Cash on delivery — pay with cash when the order arrives' : 'Paid with Razorpay'}
                </p>
              </div>
            </div>

            <ul className="mt-8 space-y-5 border-t border-[var(--color-border)] pt-6">
              {(order.items || []).map((item) => (
                <li key={item.id || item.sku} className="flex gap-4 text-sm">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-24 w-18 shrink-0 object-cover sm:w-20" />
                  ) : (
                    <div className="h-24 w-18 shrink-0 bg-[var(--color-bg-muted)] sm:w-20" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold tracking-wide">{item.productName}</p>
                    <p className="text-[var(--color-text-muted)]">{item.productTitle}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                      {item.colourName} / {item.size} · Qty {item.quantity}
                    </p>
                    {item.personalization?.textFront ? (
                      <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                        Front: {item.personalization.textFront}
                        {item.personalization.textBack ? ` · Back: ${item.personalization.textBack}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-medium">{formatInr(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatInr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{Number(order.shipping) ? formatInr(order.shipping) : 'Free'}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatInr(order.grandTotal)}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/shop"
          className="inline-flex min-h-11 items-center border border-[#5F6F64]/40 px-5 text-sm text-[#000000] hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"
        >
          Keep shopping
        </Link>
        {user ? (
          <Link
            to="/account/orders"
            className="inline-flex min-h-11 items-center border border-[#5F6F64]/40 px-5 text-sm text-[#000000] hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"
          >
            View orders
          </Link>
        ) : null}
      </div>
    </div>
  );
}
