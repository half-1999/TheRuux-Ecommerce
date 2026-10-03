import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProductGrid } from '../product/ProductGrid';
import { prefersReducedMotion } from '../../animations/motion';

gsap.registerPlugin(ScrollTrigger);

export function NewArrivalsSection({ products, loading }) {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(ref.current.querySelectorAll('[data-arrive]'), {
        y: 36,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 82%',
          once: true,
        },
      });
    }, ref);
    return () => ctx.revert();
  }, [products, loading]);

  return (
    <section
      ref={ref}
      className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]"
    >
      <div data-arrive className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
            New Arrivals
          </p>
          <h2 className="mt-2 text-[length:var(--text-2xl)] font-semibold leading-tight md:text-[length:var(--text-3xl)]">
            Scroll the drop. Feel the pace.
          </h2>
        </div>
        <Link
          to="/shop"
          className="text-sm font-medium uppercase tracking-[var(--tracking-caps)] underline-offset-4 hover:underline"
        >
          Shop All
        </Link>
      </div>
      <div data-arrive>
        <ProductGrid products={products?.slice(0, 4)} loading={loading} />
      </div>
    </section>
  );
}
