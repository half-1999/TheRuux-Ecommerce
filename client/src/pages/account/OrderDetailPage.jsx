import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/client';
import { formatInr } from '../../lib/media';
import { formatOrderDate, orderStatusLabel, paymentStatusLabel } from '../../lib/orderStatus';

function moneyOrFree(value) {
  return Number(value) ? formatInr(value) : 'Free';
}

function AddressBlock({ address }) {
  if (!address?.line1 && !address?.city) {
    return <p className="mt-2 text-sm text-[var(--color-text-muted)]">No address on this order.</p>;
  }
  return (
    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
      {address.fullName ? <span className="block text-[var(--color-text)]">{address.fullName}</span> : null}
      {address.phone ? <span className="block">{address.phone}</span> : null}
      {address.line1}
      {address.line2 ? (
        <>
          <br />
          {address.line2}
        </>
      ) : null}
      <br />
      {[address.city, address.state].filter(Boolean).join(', ')} {address.postalCode}
      {address.country ? (
        <>
          <br />
          {address.country}
        </>
      ) : null}
    </p>
  );
}

function sameAddress(a, b) {
  if (!a || !b) return false;
  return ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'].every(
    (key) => (a[key] || '') === (b[key] || ''),
  );
}

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

  const billingDiffers = data.billingAddress && !sameAddress(data.shippingAddress, data.billingAddress);

  return (
    <div className="pb-16">
      <Link to="/account/orders" className="text-sm underline">
        ← Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{data.orderNumber}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Placed {formatOrderDate(data.placedAt)}</p>
          {data.paidAt ? (
            <p className="text-sm text-[var(--color-text-muted)]">Paid {formatOrderDate(data.paidAt)}</p>
          ) : null}
        </div>
        <p className="text-lg font-medium">{formatInr(data.grandTotal)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[var(--tracking-caps)]">
        <span className="border border-[var(--color-border)] px-2 py-1">{orderStatusLabel(data.status)}</span>
        <span className="border border-[var(--color-border)] px-2 py-1">
          Payment {paymentStatusLabel(data.paymentStatus)}
        </span>
      </div>
      {data.statusReason ? <p className="mt-3 max-w-xl text-sm text-[var(--color-text)]">{data.statusReason}</p> : null}

      <section className="mt-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          Pieces
        </h3>
        <ul className="mt-4 space-y-5">
          {data.items?.map((item) => (
            <li key={item.id} className="flex gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-28 w-20 shrink-0 object-cover sm:h-32 sm:w-24" />
              ) : (
                <div className="h-28 w-20 shrink-0 bg-[var(--color-bg-muted)] sm:h-32 sm:w-24" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                {item.productSlug ? (
                  <Link to={`/product/${item.productSlug}`} className="font-semibold underline-offset-2 hover:underline">
                    {item.productName}
                  </Link>
                ) : (
                  <p className="font-semibold">{item.productName}</p>
                )}
                {item.productTitle ? <p className="text-[var(--color-text-muted)]">{item.productTitle}</p> : null}
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                  {[item.colourName, item.size].filter(Boolean).join(' / ')}
                  {item.sku ? ` · ${item.sku}` : ''}
                  {` · Qty ${item.quantity}`}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                  {formatInr(item.unitPrice)} each
                </p>
                {item.personalization?.textFront || item.personalization?.textBack ? (
                  <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                    {item.personalization.textFront ? `Front: ${item.personalization.textFront}` : ''}
                    {item.personalization.textFront && item.personalization.textBack ? ' · ' : ''}
                    {item.personalization.textBack ? `Back: ${item.personalization.textBack}` : ''}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-medium">{formatInr(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <span>Subtotal</span>
          <span>{formatInr(data.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Shipping</span>
          <span>{moneyOrFree(data.shipping)}</span>
        </div>
        {Number(data.tax) ? (
          <div className="flex justify-between gap-4">
            <span>Tax</span>
            <span>{formatInr(data.tax)}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 font-medium">
          <span>Total</span>
          <span>{formatInr(data.grandTotal)}</span>
        </div>
      </section>

      <section className="mt-8 grid gap-8 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            Contact
          </h3>
          <p className="mt-2 text-sm">{data.shippingAddress?.fullName}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{data.email}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{data.phone}</p>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            Shipping address
          </h3>
          <AddressBlock address={data.shippingAddress} />
        </div>
        {billingDiffers ? (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              Billing address
            </h3>
            <AddressBlock address={data.billingAddress} />
          </div>
        ) : null}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            Shipping method
          </h3>
          <p className="mt-2 text-sm">
            {data.shippingLabel || '—'}
            {data.shippingEstimate ? ` · ${data.shippingEstimate}` : ''}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{moneyOrFree(data.shipping)}</p>
          {data.trackingNumber ? (
            <p className="mt-2 text-sm">
              Tracking {data.carrier ? `${data.carrier} · ` : ''}
              {data.trackingNumber}
            </p>
          ) : null}
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            Payment
          </h3>
          <p className="mt-2 text-sm">
            {data.paymentLabel || '—'}
            {data.paymentDetail ? ` · ${data.paymentDetail}` : ''}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{paymentStatusLabel(data.paymentStatus)}</p>
          {data.paidAt ? (
            <p className="text-sm text-[var(--color-text-muted)]">Paid {formatOrderDate(data.paidAt)}</p>
          ) : null}
        </div>
      </section>

      {data.timeline?.length ? (
        <section className="mt-8 border-t border-[var(--color-border)] pt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            Updates
          </h3>
          <ol className="mt-4 space-y-4">
            {data.timeline.map((entry, index) => (
              <li key={`${entry.status}-${entry.at || index}`} className="text-sm">
                <p className="font-medium">{orderStatusLabel(entry.status)}</p>
                {entry.note ? <p className="text-[var(--color-text-muted)]">{entry.note}</p> : null}
                {entry.at ? <p className="text-xs text-[var(--color-text-subtle)]">{formatOrderDate(entry.at)}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
