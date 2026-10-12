import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkoutApi, meApi } from '../api/client';
import { formatInr } from '../lib/media';
import { orderStatusLabel } from '../lib/orderStatus';
import { AddressDialog } from '../components/commerce/AddressDialog';
import { Button, Input } from '../components/ui';
import { useCart } from '../hooks/useCart';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useBuyNowStore } from '../store/buyNowStore';

function PaymentOutcome({ payment, checking }) {
  if (checking) return <p className="mt-4 text-sm">Checking payment…</p>;
  if (!payment?.orderNumber) return null;
  return (
    <div className="mt-6 border border-[var(--color-border)] px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Order
      </p>
      <p className="mt-2 text-lg font-semibold">{payment.orderNumber}</p>
      <p className="mt-2 text-sm">
        {orderStatusLabel(payment.status)} · {payment.paymentStatus}
      </p>
      {payment.reason ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">{payment.reason}</p> : null}
      <Link to={`/account/orders/${payment.orderNumber}`} className="mt-4 inline-block text-sm underline">
        View this order
      </Link>
    </div>
  );
}

function addressLines(addr) {
  if (!addr) return '';
  return [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`, addr.country]
    .filter(Boolean)
    .join('\n');
}

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const cashfreeReturn = searchParams.get('cashfree_order');
  const buyNowMode = searchParams.get('mode') === 'buynow';
  const buyNowItem = useBuyNowStore((s) => s.item);
  const clearBuyNow = useBuyNowStore((s) => s.clear);
  const { data: cart, isLoading } = useCart();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const locateRef = useRef(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [guestAddress, setGuestAddress] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const { data: commerceOptions } = useQuery({
    queryKey: ['commerce-options'],
    queryFn: checkoutApi.options,
  });
  const returnConfirm = useQuery({
    queryKey: ['cashfree-return', cashfreeReturn],
    queryFn: () => checkoutApi.confirmPayment({ cashfreeOrderId: cashfreeReturn }),
    enabled: Boolean(cashfreeReturn),
    retry: false,
  });
  const shippingOptions = commerceOptions?.shippingMethods || [];
  const paymentOptions = commerceOptions?.paymentMethods || [];
  const activeShipping =
    shippingOptions.find((method) => method.id === shippingMethod) || shippingOptions[0] || null;
  const activePayment =
    paymentOptions.find((method) => method.id === paymentMethod) || paymentOptions[0] || null;
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [form, setForm] = useState(() => ({
    email: user?.email || '',
    phone: user?.phone || '',
    fullName: user?.name || '',
  }));

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: meApi.get,
    enabled: Boolean(user),
  });
  const profilePhone = profile?.user?.phone || user?.phone || '';
  const phone = phoneEdited ? form.phone : profilePhone || form.phone;

  useEffect(() => {
    if (!returnConfirm.data?.orderNumber) return undefined;
    qc.invalidateQueries({ queryKey: ['orders'] });
    if (returnConfirm.data.paymentStatus !== 'PAID') return undefined;
    const orderNumber = returnConfirm.data.orderNumber;
    window.sessionStorage.setItem(
      `theruux-order-${orderNumber}`,
      JSON.stringify({
        orderNumber,
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod: 'cashfree',
        paymentLabel: 'Cashfree',
      }),
    );
    navigate(`/order-confirmation/${orderNumber}`, { replace: true });
    return undefined;
  }, [returnConfirm.data, navigate, qc]);

  const { data: addressBook } = useQuery({
    queryKey: ['addresses'],
    queryFn: meApi.addresses,
    enabled: Boolean(user),
  });
  const saved = addressBook?.items || [];
  const activeSaved = saved.find(
    (addr) => addr.id === (pickedId || saved.find((item) => item.isDefault)?.id || saved[0]?.id),
  );
  const chosen = user ? activeSaved : guestAddress;

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

  const shippingFee = Number(activeShipping?.price ?? activeShipping?.priceInr ?? 0) || 0;
  const grand = subtotal + shippingFee;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveAddress = async (address) => {
    if (user) {
      setSavingAddress(true);
      try {
        const created = await meApi.createAddress({ ...address, isDefault: saved.length === 0 });
        await qc.invalidateQueries({ queryKey: ['addresses'] });
        setPickedId(created.id);
        setDialogOpen(false);
        push({ title: 'Address saved.' });
      } catch (err) {
        push({ title: 'Could not save', message: err.message });
      } finally {
        setSavingAddress(false);
      }
      return;
    }
    setGuestAddress(address);
    setDialogOpen(false);
    push({ title: 'Address added.' });
  };

  const rememberOrder = (orderNumber, paid = true) => {
    const cash = activePayment?.id === 'cod';
    const snapshot = {
      orderNumber,
      email: form.email,
      phone,
      status: cash ? 'PROCESSING' : paid ? 'PAID' : 'PENDING_PAYMENT',
      paymentStatus: cash || !paid ? 'PENDING' : 'PAID',
      paymentMethod: activePayment?.id,
      paymentLabel: activePayment?.label,
      shippingMethodId: activeShipping?.id,
      shippingLabel: activeShipping
        ? `${activeShipping.label || activeShipping.name}${activeShipping.detail || activeShipping.estimate ? ` · ${activeShipping.detail || activeShipping.estimate}` : ''}`
        : '',
      shippingAddress: {
        fullName: form.fullName,
        phone,
        line1: chosen.line1,
        line2: chosen.line2 || '',
        city: chosen.city,
        state: chosen.state,
        postalCode: chosen.postalCode,
        country: chosen.country || 'IN',
      },
      items: lineItems.map((item) => ({
        id: item.id,
        productName: item.product?.name || item.productName,
        productTitle: item.product?.title || item.productTitle,
        size: item.size,
        colourName: item.colourName,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        imageUrl: item.image?.url || '',
        personalization: item.personalization || null,
      })),
      subtotal,
      shipping: shippingFee,
      tax: 0,
      grandTotal: grand,
      placedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(`theruux-order-${orderNumber}`, JSON.stringify(snapshot));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!activeShipping || !activePayment) {
      push({ title: 'Checkout unavailable', message: 'Shipping or payment is not enabled.' });
      return;
    }
    if (!chosen?.line1) {
      push({ title: 'Add an address', message: 'Choose a saved address or add a new one.' });
      setDialogOpen(true);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        phone,
        shippingMethodId: activeShipping?.id,
        paymentMethod: activePayment?.id,
        shippingAddress: {
          fullName: form.fullName,
          phone,
          line1: chosen.line1,
          line2: chosen.line2 || '',
          city: chosen.city,
          state: chosen.state,
          postalCode: chosen.postalCode,
          country: chosen.country || 'IN',
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

      if (result.payment?.provider !== 'cashfree') {
        rememberOrder(result.orderNumber, false);
        clearBuyNow();
        qc.invalidateQueries({ queryKey: ['cart'] });
        qc.invalidateQueries({ queryKey: ['product'] });
        push({
          title: 'GOOD CHOICE.',
          message: 'Pay with cash when the order arrives.',
        });
        navigate(`/order-confirmation/${result.orderNumber}`);
        return;
      }

      if (!window.Cashfree) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Could not load Cashfree checkout'));
          document.body.appendChild(script);
        });
      }

      const cashfree = window.Cashfree({ mode: result.payment.mode || 'sandbox' });
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: result.payment.paymentSessionId,
        redirectTarget: '_modal',
      });
      if (checkoutResult?.error) {
        const settled = await checkoutApi.abandonPayment({
          cashfreeOrderId: result.payment.cashfreeOrderId,
        });
        if (settled.paymentStatus === 'PAID') {
          rememberOrder(settled.orderNumber, true);
          clearBuyNow();
          qc.invalidateQueries({ queryKey: ['cart'] });
          qc.invalidateQueries({ queryKey: ['product'] });
          push({ title: 'GOOD CHOICE.', message: "We'll handle the rest." });
          navigate(`/order-confirmation/${settled.orderNumber}`);
          return;
        }
        setPaymentResult(settled);
        qc.invalidateQueries({ queryKey: ['orders'] });
        push({
          title: orderStatusLabel(settled.status),
          message: settled.reason || 'Payment was not completed. Your bag is unchanged — you can try again.',
        });
        return;
      }

      const confirmed = await checkoutApi.confirmPayment({
        cashfreeOrderId: result.payment.cashfreeOrderId,
      });
      if (confirmed.paymentStatus !== 'PAID') {
        setPaymentResult(confirmed);
        qc.invalidateQueries({ queryKey: ['orders'] });
        push({
          title: orderStatusLabel(confirmed.status),
          message: confirmed.reason || 'Payment was not completed. Your bag is unchanged — you can try again.',
        });
        return;
      }
      rememberOrder(confirmed.orderNumber, true);
      clearBuyNow();
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      push({ title: 'GOOD CHOICE.', message: "We'll handle the rest." });
      navigate(`/order-confirmation/${confirmed.orderNumber}`);
    } catch (err) {
      push({
        title: 'Checkout failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!buyNowMode && isLoading && !cashfreeReturn) {
    return <div className="px-[var(--space-header-x)] py-28">Loading bag…</div>;
  }

  const returnedPayment =
    returnConfirm.data?.orderNumber && returnConfirm.data.paymentStatus !== 'PAID'
      ? returnConfirm.data
      : paymentResult?.orderNumber && paymentResult.paymentStatus !== 'PAID'
        ? paymentResult
        : null;

  if (!lineItems.length && !returnedPayment && !(cashfreeReturn && returnConfirm.isFetching)) {
    return (
      <div className="mx-auto max-w-lg px-[var(--space-header-x)] pt-50 h-screen pb-24">
        <p className="text-lg font-semibold">NOTHING HERE YET.</p>
        <Link to="/shop" className="mt-4 inline-block border border-[#5F6F64]/40 btn-hover active:scale-[0.98] px-5 py-2 text-sm text-[#000000]">
          Shop All
        </Link>
      </div>
    );
  }

  if (!lineItems.length) {
    return (
      <div className="mx-auto max-w-lg px-[var(--space-header-x)] pt-50 pb-24">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <PaymentOutcome payment={returnedPayment} checking={Boolean(cashfreeReturn) && returnConfirm.isFetching} />
        {returnConfirm.isError ? (
          <p className="mt-4 text-sm text-[var(--color-text)]">{returnConfirm.error.message}</p>
        ) : null}
        <Link to="/account/orders" className="mt-6 inline-block text-sm underline">
          Order history
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[var(--container)] gap-12 px-[var(--space-header-x)] pb-24 pt-50 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          {buyNowMode ? 'Express checkout' : 'Bag checkout'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Checkout</h1>
        <PaymentOutcome payment={returnedPayment} checking={Boolean(cashfreeReturn) && returnConfirm.isFetching} />
        {returnConfirm.isError ? (
          <p className="mt-4 text-sm text-[var(--color-text)]">{returnConfirm.error.message}</p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-10 space-y-8">
          <div className="space-y-5">
            <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Full name" required value={form.fullName} onChange={set('fullName')} />
              <Input
                label="Phone"
                required
                value={phone}
                onChange={(e) => {
                  setPhoneEdited(true);
                  set('phone')(e);
                }}
              />
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-caps)]">Address</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDialogKey((key) => key + 1);
                  setDialogOpen(true);
                  setTimeout(() => locateRef.current?.(), 0);
                }}
              >
                Add new address
              </Button>
            </div>
            {user && saved.length ? (
              <ul className="mt-4 space-y-3">
                {saved.map((addr) => {
                  const selected = chosen?.id === addr.id;
                  return (
                    <li key={addr.id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(addr.id)}
                        className={`w-full border px-4 py-3 text-left text-sm ${
                          selected
                            ? 'border-[#1c4332] bg-[#e7f0ea]'
                            : 'border-[var(--color-border)]'
                        }`}
                      >
                        <span className="font-medium">
                          {addr.label || 'Address'}
                          {addr.isDefault ? ' · Default' : ''}
                          {selected ? ' · Selected' : ''}
                        </span>
                        <span className="mt-1 block whitespace-pre-line text-[var(--color-text-muted)]">
                          {addressLines(addr)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : chosen ? (
              <div className="mt-4 border border-[#1c4332] bg-[#e7f0ea] px-4 py-3 text-sm">
                <p className="font-medium">Selected address</p>
                <p className="mt-1 whitespace-pre-line text-[var(--color-text-muted)]">{addressLines(chosen)}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                No saved address yet. Add one to continue.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-caps)]">Shipping</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {shippingOptions.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setShippingMethod(method.id)}
                  className={`border px-4 py-3 text-left text-sm ${
                    activeShipping?.id === method.id
                      ? 'border-[#1c4332] bg-[#e7f0ea]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <span className="font-medium">{method.label || method.name}</span>
                  <span className="mt-1 block text-[var(--color-text-muted)]">{method.detail || method.estimate}</span>
                  <span className="mt-2 block font-medium">
                    {Number(method.price) ? formatInr(method.price) : 'Free'}
                  </span>
                </button>
              ))}
            </div>
            {!shippingOptions.length ? (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">No shipping methods are available.</p>
            ) : null}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-caps)]">Payment</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {paymentOptions.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`border px-4 py-3 text-left text-sm ${
                    activePayment?.id === method.id
                      ? 'border-[#1c4332] bg-[#e7f0ea]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <span className="font-medium">{method.label}</span>
                  <span className="mt-1 block text-[var(--color-text-muted)]">{method.detail}</span>
                </button>
              ))}
            </div>
            {!paymentOptions.length ? (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">No payment methods are available.</p>
            ) : null}
          </section>

          <Button
            type="submit"
            loading={loading}
            disabled={!activeShipping || !activePayment}
            className="w-full sm:w-auto"
          >
            {activePayment?.id === 'cod' ? `Pay with cash · ${formatInr(grand)}` : `Pay ${formatInr(grand)}`}
          </Button>
        </form>
      </div>

      <aside className="h-fit border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 lg:sticky lg:top-[var(--header-height)]">
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
        <div className="mt-6 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatInr(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shippingFee ? formatInr(shippingFee) : 'Free'}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatInr(grand)}</span>
          </div>
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

      <AddressDialog
        key={dialogKey}
        open={dialogOpen}
        locateRef={locateRef}
        onClose={() => setDialogOpen(false)}
        onSave={saveAddress}
        saving={savingAddress}
      />
    </div>
  );
}
