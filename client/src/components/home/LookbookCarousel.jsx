import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mood } from '../../lib/media';
import { prefersReducedMotion } from '../../animations/motion';

gsap.registerPlugin(ScrollTrigger);

const LOOKS = [
  { src: mood.grid[0], label: 'AARAMBH' },
  { src: mood.grid[1], label: 'RAFTAAR' },
  { src: mood.grid[2], label: 'REBIRTH' },
  { src: mood.grid[3], label: 'REBEL' },
  { src: mood.grid[4], label: 'LIMITLESS' },
  { src: mood.grid[5], label: 'IDENTITY' },
];

/** Horizontal editorial carousel with scrub parallax — between New Arrivals and Udbhav. */
export function LookbookCarousel() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current || !trackRef.current) return undefined;
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const amount = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
      gsap.to(track, {
        x: () => -amount(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${amount()}`,
          scrub: 0.85,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[var(--color-bg)]">
      <div className="px-[var(--space-header-x)] pt-[var(--space-section-y)]">
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          Lookbook
        </p>
        <h2 className="mt-2 max-w-xl text-[length:var(--text-2xl)] font-semibold md:text-[length:var(--text-3xl)]">
          Scroll the drop. Feel the pace.
        </h2>
      </div>
      <div className="mt-10 pb-[var(--space-section-y)]">
        <div ref={trackRef} className="flex w-max gap-4 px-[var(--space-header-x)] will-change-transform md:gap-6">
          {LOOKS.map((look) => (
            <Link
              key={look.label}
              to="/collections/udbhav"
              className="group relative block h-[58vh] w-[72vw] shrink-0 overflow-hidden bg-[var(--color-bg-muted)] sm:w-[42vw] md:h-[70vh] md:w-[28vw]"
            >
              <img
                src={look.src}
                alt={look.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 text-sm font-semibold tracking-[0.14em] text-[#F5F2EC]">
                {look.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
