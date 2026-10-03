import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Heart } from '@phosphor-icons/react';
import { catalogApi } from '../api/client';
import { formatInr } from '../lib/media';
import { Button, Skeleton } from '../components/ui';
import { useAddToCart, useCart } from '../hooks/useCart';
import { useToggleWishlist, useWishlist } from '../hooks/useWishlist';
import { useBuyNowStore } from '../store/buyNowStore';
import { useToastStore } from '../store/toastStore';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.product(slug),
  });
  const add = useAddToCart();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const toggleWish = useToggleWishlist();
  const setBuyNow = useBuyNowStore((s) => s.setItem);
  const push = useToastStore((s) => s.push);

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState(null);
  const [colour, setColour] = useState(null);
  const [personalization, setPersonalization] = useState({ textFront: '', textBack: '' });

  useEffect(() => {
    if (!product) return;
    document.title = product.seo?.title || `${product.name} — ${product.title} | TheRuux`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && product.seo?.description) {
      meta.setAttribute('content', product.seo.description);
    }
    if (product.seo?.keywords) {
      let keywords = document.querySelector('meta[name="keywords"]');
      if (!keywords) {
        keywords = document.createElement('meta');
        keywords.setAttribute('name', 'keywords');
        document.head.appendChild(keywords);
      }
      keywords.setAttribute('content', product.seo.keywords);
    }
  }, [product]);

  const colours = useMemo(() => {
    if (!product?.variants) return [];
    const map = new Map();
    product.variants.forEach((v) => {
      if (!map.has(v.colourName)) map.set(v.colourName, v);
    });
    return [...map.values()];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product?.variants) return [];
    const c = colour || colours[0]?.colourName;
    return product.variants.filter((v) => v.colourName === c);
  }, [product, colour, colours]);

  const selectedVariant = useMemo(() => {
    const c = colour || colours[0]?.colourName;
    const s = size || sizes[0]?.size;
    return product?.variants?.find((v) => v.colourName === c && v.size === s);
  }, [product, colour, size, colours, sizes]);

  const wishActive = Boolean(wishlist?.items?.some((p) => p.id === product?.id));
  const inBag = Boolean(
    cart?.items?.some(
      (item) => item.product?.id === product?.id && item.variantId === selectedVariant?.id,
    ),
  );

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[var(--container)] gap-10 px-[var(--space-header-x)] pb-24 pt-50 lg:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-50">
        <p className="text-lg font-semibold">WE LOOKED. NOTHING.</p>
        <Link to="/shop" className="mt-4 inline-block underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const featuresText = product.features?.length
    ? product.features.map((f) => `• ${f}`).join('\n')
    : '';

  const addPayload = () => {
    const textFront = personalization.textFront.trim();
    const textBack = personalization.textBack.trim();
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: 1,
      ...(product.allowsPersonalization && textFront
        ? { personalization: { textFront, ...(textBack ? { textBack } : {}) } }
        : {}),
    };
  };

  const requireFrontText = () => {
    if (!product.allowsPersonalization || personalization.textFront.trim()) return true;
    push({ title: 'Add front text', message: 'This piece needs a name on the front.' });
    document.querySelector('input')?.focus();
    return false;
  };

  return (
    <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pb-24 pt-50">
      <nav className="mb-6 shrink-0 text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        <Link to="/">Home</Link>
        <span className="mx-2">/</span>
        {product.collections?.[0] ? (
          <>
            <Link to={`/collections/${product.collections[0].slug}`}>{product.collections[0].name}</Link>
            <span className="mx-2">/</span>
          </>
        ) : null}
        <span>{product.name}</span>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="aspect-[3/4] overflow-hidden bg-[var(--color-bg-muted)]">
            {images[activeImage] ? (
              <img
                src={images[activeImage].url}
                alt={images[activeImage].alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden border ${
                    i === activeImage ? 'border-[var(--color-border-strong)]' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-wide">{product.name}</h1>
              <p className="mt-1 text-[var(--color-text-muted)]">{product.title}</p>
            </div>
            <button
              type="button"
              aria-label={wishActive ? 'Saved to wishlist' : 'Wishlist'}
              aria-pressed={wishActive}
              className={`inline-flex h-11 items-center gap-2 px-2 ${
                wishActive ? 'text-[#1c4332]' : ''
              }`}
              onClick={() => toggleWish.mutate({ productId: product.id, isActive: wishActive, product })}
            >
              <Heart
                size={22}
                weight={wishActive ? 'fill' : 'light'}
                className={wishActive ? 'text-[#1c4332]' : ''}
              />
              {wishActive ? (
                <span className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)]">
                  Saved
                </span>
              ) : null}
            </button>
          </div>
          <p className="mt-4 text-lg font-medium">{formatInr(product.price)}</p>
          {product.namingNote ? (
            <p className="mt-2 text-xs text-[var(--color-text-subtle)]">{product.namingNote}</p>
          ) : null}

          {colours.length > 0 ? (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Colour — {colour || colours[0].colourName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colours.map((c) => (
                  <button
                    key={c.colourName}
                    type="button"
                    onClick={() => {
                      setColour(c.colourName);
                      setSize(null);
                    }}
                    className={`min-h-11 border px-3 text-sm ${
                      (colour || colours[0].colourName) === c.colourName
                        ? 'border-[var(--color-border-strong)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    {c.colourName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Size
              </p>
              <Link to="/help/size-guide" className="text-xs underline underline-offset-4">
                DON&apos;T GUESS YOUR SIZE.
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.available}
                  onClick={() => setSize(v.size)}
                  className={`min-h-11 min-w-11 border px-3 text-sm disabled:opacity-30 ${
                    (size || sizes[0]?.size) === v.size
                      ? 'border-[#1a1a1a] bg-[#141414] text-[#F5F2EC]'
                      : 'border-[var(--color-border)] text-[#141414]'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {product.allowsPersonalization ? (
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                Front text
                <input
                  className="mt-1 w-full border-b border-[var(--color-border)] bg-transparent py-2 outline-none"
                  maxLength={24}
                  value={personalization.textFront}
                  onChange={(e) => setPersonalization((p) => ({ ...p, textFront: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                Back text (optional)
                <input
                  className="mt-1 w-full border-b border-[var(--color-border)] bg-transparent py-2 outline-none"
                  maxLength={24}
                  value={personalization.textBack}
                  onChange={(e) => setPersonalization((p) => ({ ...p, textBack: e.target.value }))}
                />
              </label>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className={`flex-1 ${inBag ? 'border-[#1c4332]' : ''}`}
              loading={add.isPending}
              disabled={!selectedVariant?.available}
              onClick={() => {
                if (!requireFrontText()) return;
                add.mutate(addPayload());
              }}
            >
              {inBag ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Check size={16} weight="bold" />
                  Added
                </span>
              ) : (
                'Add to Bag'
              )}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={!selectedVariant?.available}
              onClick={() => {
                if (!selectedVariant || !requireFrontText()) return;
                setBuyNow({
                  productId: product.id,
                  variantId: selectedVariant.id,
                  quantity: 1,
                  name: product.name,
                  title: product.title,
                  slug: product.slug,
                  size: selectedVariant.size,
                  colourName: selectedVariant.colourName,
                  image: images[0] || product.image,
                  lineTotal: Number(selectedVariant.price) || selectedVariant.price,
                  personalization: product.allowsPersonalization
                    ? {
                        textFront: personalization.textFront.trim(),
                        ...(personalization.textBack.trim()
                          ? { textBack: personalization.textBack.trim() }
                          : {}),
                      }
                    : undefined,
                });
                navigate('/checkout?mode=buynow');
              }}
            >
              Buy Now
            </Button>
          </div>

          <div className="mt-10 space-y-3 border-t border-[var(--color-border)] pt-6">
            {[
              ['Description', product.description],
              ['Key features', featuresText],
              ['Details', product.details],
              ['Fabric & materials', product.fabric],
              ['Fit', product.fit],
              ['Size guide', product.sizeGuide],
              ['Care', product.care || 'COLD WASH. LOW DRAMA.'],
              ['Shipping & Returns', product.shippingNote],
              ['Model Info', product.modelInfo],
            ]
              .filter(([, body]) => body)
              .map(([label, body]) => (
                <details key={label} className="group border-b border-[var(--color-border)] pb-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium">
                    {label}
                    <span className="text-[var(--color-text-subtle)] group-open:hidden">+</span>
                    <span className="hidden text-[var(--color-text-subtle)] group-open:inline">−</span>
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {body}
                  </p>
                </details>
              ))}
          </div>

          {product.instagramLinks?.length ? (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Seen On
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">TheRuux, out there.</p>
              <ul className="mt-3 space-y-2">
                {product.instagramLinks.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-sm underline">
                      {l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
