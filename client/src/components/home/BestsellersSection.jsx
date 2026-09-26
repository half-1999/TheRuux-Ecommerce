import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mood } from '../../lib/media';
import { prefersReducedMotion } from '../../animations/motion';

gsap.registerPlugin(ScrollTrigger);

export function BestsellersSection() {
  const ref = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.06 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, scrub: true, start: 'top bottom', end: 'bottom top' },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative min-h-[70vh] overflow-hidden bg-[var(--color-bg-muted)]">
      {/* REPLACE: bestsellers campaign visual */}
      <img
        ref={imgRef}
        src={mood.bestsellers}
        alt="TheRuux bestsellers"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-[70vh] flex-col items-start justify-end px-[var(--space-header-x)] py-16 text-white md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-white/60">
          Bestsellers
        </p>
        <h2 className="mt-2 max-w-lg text-[length:var(--text-display)] font-semibold leading-none">
          Already spoken for — still worth chasing.
        </h2>
        <Link
          to="/bestsellers"
          className="mt-8 inline-flex min-h-11 items-center gap-2 bg-[#F5F2EC] px-5 py-2.5 text-sm font-medium text-[#141414] transition-transform active:scale-[0.98]"
        >
          <span>Shop bestsellers</span>
          <span className="inline-flex h-7 w-7 items-center justify-center border border-[#141414]/15" aria-hidden>
            <ArrowRight size={16} weight="bold" />
          </span>
        </Link>
      </div>
    </section>
  );
}
