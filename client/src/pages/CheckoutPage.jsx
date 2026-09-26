import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin } from '@phosphor-icons/react';
import { useCart } from '../hooks/useCart';
import { checkoutApi } from '../api/client';
import { formatInr } from '../lib/media';
import { requestGeolocation, reverseGeocode } from '../lib/geolocation';
import { Button, Input } from '../components/ui';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useBuyNowStore } from '../store/buyNowStore';

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const buyNowMode = searchParams.get('mode') === 'buynow';
  const buyNowItem = useBuyNowStore((s) => s.item);
  const clearBuyNow = useBuyNowStore((s) => s.clear);
  const { data: cart, isLoading } = useCart();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [form, setForm] = useState(() => ({
    email: user?.email || '',
    phone: '',
    fullName: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
  }));

  // Cart checkout clears any leftover buy-now session
  useEffect(() => {
    if (!buyNowMode) clearBuyNow();
  }, [buyNowMode, clearBuyNow]);

  const lineItems = useMemo(() => {
    if (buyNowMode && buyNowItem) {
      return [
        {
          id: 'buynow',
          product: { name: buyNowItem.name, title: buyNowItem.title, slug: buyNowItem.slug },
          quantity: buyNowItem.quantity || 1,
          size: buyNowItem.size,
          colourName: buyNowItem.colourName,
          lineTotal: buyNowItem.lineTotal,
          image: buyNowItem.image,
        },
      ];
    }
    return cart?.items || [];
  }, [buyNowMode, buyNowItem, cart]);

  const subtotal = useMemo(() => {
    if (buyNowMode && buyNowItem) return Number(buyNowItem.lineTotal) || 0;
    return Number(cart?.subtotal) || 0;
  }, [buyNowMode, buyNowItem, cart]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const autofillFromLocation = async () => {
    setGeoLoading(true);
    try {
      const { lat, lon } = await requestGeolocation();
      const addr = await reverseGeocode(lat, lon);
      setForm((f) => ({
        ...f,
        line1: addr.line1 || f.line1,
        line2: addr.line2 || f.line2,
        city: addr.city || f.city,
        state: addr.state || f.state,
        postalCode: addr.postalCode || f.postalCode,
        country: addr.country || f.country,
      }));
      push({ title: 'Address suggested', message: 'Review and edit before paying.' });
    } catch {
      push({
        title: 'Location unavailable',
        message: 'Allow location access or enter your address manually.',
      });
    } finally {
      setGeoLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        phone: form.phone,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      };

      if (buyNowMode && buyNowItem) {
        payload.buyNow = {
          productId: buyNowItem.productId,
          variantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity || 1,
          personalization: buyNowItem.personalization || undefined,
        };
      }

      const result = await checkoutApi.create(payload);

      if (result.payment?.mock || !result.payment?.keyId) {
        await checkoutApi.confirmPayment({
          razorpayOrderId: result.payment.razorpayOrderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'dev',
        });
        clearBuyNow();
        push({ title: 'GOOD CHOICE.', message: "We'll handle the rest." });
        navigate(`/order-confirmation/${result.orderNumber}`);
        return;
      }

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });

      const RazorpayCheckout = window.Razorpay;
      await new Promise((resolve, reject) => {
        const rzp = new RazorpayCheckout({
          key: result.payment.keyId,
          amount: result.payment.amountPaise,
          currency: result.payment.currency,
          name: 'TheRuux',
          description: result.orderNumber,
          order_id: result.payment.razorpayOrderId,
          handler: async (response) => {
            try {
              await checkoutApi.confirmPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearBuyNow();
              push({ title: 'GOOD CHOICE.', message: "We'll handle the rest." });
              navigate(`/order-confirmation/${result.orderNumber}`);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.open();
      });
    } catch (err) {
      push({ title: 'Checkout failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!buyNowMode && isLoading) {
    return <div className="px-[var(--space-header-x)] py-28">Loading bag…</div>;
  }

  if (!lineItems.length) {
    return (
      <div className="mx-auto max-w-lg px-[var(--space-header-x)] py-28">
        <p className="text-lg font-semibold">NOTHING HERE YET.</p>
        <Link to="/shop" className="mt-4 inline-block underline">
          Shop All
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[var(--container)] gap-12 px-[var(--space-header-x)] pb-24 pt-28 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          {buyNowMode ? 'Express checkout' : 'Bag checkout'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Checkout</h1>
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Phone" required value={form.phone} onChange={set('phone')} />
          <Input label="Full name" required value={form.fullName} onChange={set('fullName')} />

          <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3">
            <p className="text-sm text-[var(--color-text-muted)]">Use your location to suggest an address</p>
            <Button
              type="button"
              variant="secondary"
              loading={geoLoading}
              onClick={autofillFromLocation}
              trailingIcon={<MapPin size={14} weight="bold" />}
            >
              Autofill
            </Button>
          </div>

          <Input label="Address line 1" required value={form.line1} onChange={set('line1')} />
          <Input label="Address line 2" value={form.line2} onChange={set('line2')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="City" required value={form.city} onChange={set('city')} />
            <Input label="State" required value={form.state} onChange={set('state')} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Postal code" required value={form.postalCode} onChange={set('postalCode')} />
            <Input label="Country" required value={form.country} onChange={set('country')} />
          </div>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Pay {formatInr(subtotal)}
          </Button>
        </form>
      </div>

      <aside className="h-fit border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 lg:sticky lg:top-28">
        <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          {buyNowMode ? 'Buying now' : 'Order summary'}
        </p>
        <ul className="mt-4 space-y-5">
          {lineItems.map((item) => (
            <li key={item.id} className="flex gap-4 text-sm">
              <div className="h-24 w-18 shrink-0 overflow-hidden bg-[var(--color-bg-muted)] sm:w-20">
                {item.image?.url ? (
                  <img src={item.image.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-wide">{item.product?.name || item.productName}</p>
                <p className="text-[var(--color-text-muted)]">{item.product?.title || item.productTitle}</p>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                  {item.colourName} / {item.size} · Qty {item.quantity}
                </p>
                <p className="mt-2 font-medium">{formatInr(item.lineTotal)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-[var(--color-border)] pt-4 font-medium">
          <span>Subtotal</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        {!buyNowMode ? (
          <Link to="/shop" className="mt-4 inline-block text-xs underline underline-offset-4">
            Continue shopping
          </Link>
        ) : (
          <p className="mt-4 text-xs text-[var(--color-text-subtle)]">
            Your bag is unchanged — this is a separate purchase.
          </p>
        )}
      </aside>
    </div>
  );
}
