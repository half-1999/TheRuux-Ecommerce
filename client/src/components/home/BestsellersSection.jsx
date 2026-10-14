import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mood } from '../../lib/media';
import { prefersReducedMotion } from '../../animations/motion';
import { CmsLink } from './CmsLink';

gsap.registerPlugin(ScrollTrigger);

export function BestsellersSection({ copy }) {
  const ref = useRef(null);
  const imgRef = useRef(null);
  const [mediaFailed, setMediaFailed] = useState(false);

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
        src={!mediaFailed && copy?.mediaUrl ? copy.mediaUrl : mood.bestsellers}
        alt="TheRuux bestsellers"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        loading="lazy"
        onError={() => setMediaFailed(true)}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-[70vh] flex-col items-start justify-end px-[var(--space-header-x)] py-16 text-white md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-white/60">
          {copy?.config?.eyebrow || 'Bestsellers'}
        </p>
        <h2 className="mt-2 max-w-lg text-[length:var(--text-display)] font-semibold leading-none">
          {copy?.title || 'Already spoken for — still worth chasing.'}
        </h2>
        <CmsLink
          href={copy?.ctaHref || '/bestsellers'}
          className="mt-8 inline-flex min-h-11 items-center gap-2 border border-white/45 px-6 py-2.5 text-sm font-medium tracking-wide text-[#F5F2EC] btn-hover active:scale-[0.98]"
        >
          <span>{copy?.ctaLabel || 'Shop bestsellers'}</span>
          <span className="inline-flex h-7 w-7 items-center justify-center border border-[#141414]/15" aria-hidden>
            <ArrowRight size={16} weight="bold" />
          </span>
        </CmsLink>
      </div>
    </section>
  );
}
