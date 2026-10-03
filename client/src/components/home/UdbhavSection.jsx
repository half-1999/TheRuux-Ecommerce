import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mood } from '../../lib/media';
import { prefersReducedMotion } from '../../animations/motion';

gsap.registerPlugin(ScrollTrigger);

export function UdbhavSection({ collection }) {
  const ref = useRef(null);
  const imgRef = useRef(null);
  const textRef = useRef(null);
  const [mediaFailed, setMediaFailed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, scrub: true, start: 'top bottom', end: 'bottom top' },
      });
      gsap.to(textRef.current, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, scrub: true, start: 'top bottom', end: 'bottom top' },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const title = collection?.name || 'Udbhav';
  const concept = collection?.conceptLine || 'Begin again.';
  const story =
    collection?.story ||
    'Origin and emergence — graphics, denim, embroidery, and experimental detailing.';
  const href = `/collections/${collection?.slug || 'udbhav'}`;
  // REPLACE: official Udbhav campaign still
  const media = !mediaFailed && collection?.heroMediaUrl ? collection.heroMediaUrl : mood.udbhav;

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)]"
    >
      <img
        ref={imgRef}
        src={media}
        alt={`${title} collection editorial`}
        className="absolute inset-0 h-[115%] w-full object-cover will-change-transform"
        loading="eager"
        onError={() => setMediaFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/15" aria-hidden />
      <div
        ref={textRef}
        className="relative z-10 mx-auto w-full max-w-[var(--container)] px-[var(--space-header-x)] pb-16 pt-28 will-change-transform md:pb-24"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-white/50">
          Collection
        </p>
        <h2 className="mt-3 text-[length:var(--text-display)] font-semibold leading-none">{title}</h2>
        <p className="mt-4 font-[family-name:var(--font-script)] text-4xl text-[var(--color-brand-subtle)]">
          {concept}
        </p>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">{story}</p>
        <Link
          to={href}
          className="mt-10 inline-flex w-fit min-h-11 items-center gap-2 border border-white/40 px-5 py-2.5 text-sm font-medium tracking-wide text-[#F5F2EC] transition-colors hover:bg-[#F5F2EC] hover:text-[#141414]"
        >
          <span>Explore {title}</span>
          <span className="inline-flex h-7 w-7 items-center justify-center border border-current/20" aria-hidden>
            <ArrowRight size={16} weight="bold" />
          </span>
        </Link>
      </div>
    </section>
  );
}
