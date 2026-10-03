import { Link } from 'react-router-dom';
import { Drawer } from '../ui/Drawer';
import { useUiStore } from '../../store/uiStore';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../../hooks/useCart';
import { formatInr } from '../../lib/media';
import { Skeleton } from '../ui/Skeleton';
import { useBuyNowStore } from '../../store/buyNowStore';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const close = useUiStore((s) => s.closeCart);
  const clearBuyNow = useBuyNowStore((s) => s.clear);
  const { data, isLoading, isError } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const items = data?.items ?? [];
  const hasItems = !isLoading && items.length > 0;
  const empty = !isLoading && !isError && items.length === 0;

  return (
    <Drawer open={open} onClose={close} side="right" title="Bag">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-[var(--color-danger)]">
              Could not load your bag. Check that the API is running.
            </p>
          ) : null}

          {empty ? (
            <div>
              <p className="text-lg font-semibold tracking-wide">NOTHING HERE YET.</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">We can fix that. 🛍️</p>
              <Link
                to="/shop"
                onClick={close}
                className="mt-8 inline-flex min-h-11 items-center px-5 text-sm text-[#000000] border border-[#5F6F64]/40 hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"
              >
                Explore the shop
              </Link>
            </div>
          ) : null}

          <ul className="space-y-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="h-28 w-20 shrink-0 overflow-hidden bg-[var(--color-bg-muted)]">
                  {item.image?.url ? (
                    <img src={item.image.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product/${item.product.slug}`}
                    onClick={close}
                    className="font-semibold tracking-wide"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-[var(--color-text-muted)]">{item.product.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                    {item.colourName} / {item.size}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      className="h-8 w-8 border border-[var(--color-border)]"
                      onClick={() =>
                        update.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })
                      }
                    >
                      −
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 border border-[var(--color-border)]"
                      onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-[var(--color-text-subtle)] underline"
                      onClick={() => remove.mutate(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-medium">{formatInr(item.lineTotal)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {hasItems ? (
          <div className="border-t border-[var(--color-border)] px-5 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Subtotal</span>
              <span className="font-medium">{formatInr(data?.subtotal ?? 0)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => {
                clearBuyNow();
                close();
              }}
              className="mt-4 flex min-h-11 items-center justify-center text-sm font-medium text-[#000000] border border-[#5F6F64]/40 hover:bg-[#000000] hover:text-[#000000] active:scale-[0.98]"
            >
              Checkout
            </Link>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
