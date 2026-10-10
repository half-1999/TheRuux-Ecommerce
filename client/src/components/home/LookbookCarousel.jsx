import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { mood } from '../../lib/media';
import mood13 from '../../assets/mood/mood-13.jpg';
import mood14 from '../../assets/mood/mood-14.jpg';
import mood15 from '../../assets/mood/mood-15.jpg';
import { prefersReducedMotion } from '../../animations/motion';
import './LookbookCarousel.css';

const LOOKS = [
  { src: mood.grid[0], label: 'AARAMBH' },
  { src: mood.grid[1], label: 'RAFTAAR' },
  { src: mood.grid[2], label: 'REBIRTH' },
  { src: mood.grid[3], label: 'REBEL' },
  { src: mood.grid[4], label: 'LIMITLESS' },
  { src: mood.grid[5], label: 'IDENTITY' },
  { src: mood13, label: 'UDBHAV' },
  { src: mood14, label: 'DENIM' },
  { src: mood15, label: 'STUDIO' },
];

const LOOP_SECONDS = 42;

function Look({ look, hidden }) {
  return (
    <Link
      to="/collections/udbhav"
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="group relative mr-4 block h-[58vh] w-[72vw] shrink-0 overflow-hidden bg-[var(--color-bg-muted)] sm:w-[42vw] md:mr-6 md:h-[70vh] md:w-[28vw]"
    >
      <img
        src={look.src}
        alt={hidden ? '' : look.label}
        loading="eager"
        className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <span className="absolute bottom-5 left-5 text-sm font-semibold tracking-[0.14em] text-[#F5F2EC]">
        {look.label}
      </span>
    </Link>
  );
}

function NavButton({ label, className, onClick, children }) {
  return (
    <button type="button" className={`lookbook-nav ${className}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

/** Continuous lookbook strip. The sequence is duplicated so the loop has no gap. */
export function LookbookCarousel() {
  const reduced = prefersReducedMotion();
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const halfRef = useRef(0);
  const [paused, setPaused] = useState(reduced);

  const frames = reduced ? LOOKS : [...LOOKS, ...LOOKS];

  useEffect(() => {
    if (reduced) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;

    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
    };
    measure();
    const observer = new window.ResizeObserver(measure);
    observer.observe(track);

    let raf = 0;
    const tick = () => {
      const half = halfRef.current;
      if (half > 0 && !pausedRef.current) {
        offsetRef.current -= half / (LOOP_SECONDS * 60);
        if (offsetRef.current <= -half) offsetRef.current += half;
        track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduced]);

  const pause = (next) => {
    pausedRef.current = next;
    setPaused(next);
  };

  const step = (direction) => {
    const track = trackRef.current;
    const card = track?.querySelector('a');
    const half = halfRef.current;
    if (!track || !card || !half) return;
    const gap = window.matchMedia('(min-width: 768px)').matches ? 24 : 16;
    offsetRef.current += direction * (card.getBoundingClientRect().width + gap);
    while (offsetRef.current <= -half) offsetRef.current += half;
    while (offsetRef.current > 0) offsetRef.current -= half;
    track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
  };

  const scrollStatic = (direction) => {
    const viewport = viewportRef.current;
    const card = viewport?.querySelector('a');
    if (!viewport || !card) return;
    const gap = window.matchMedia('(min-width: 768px)').matches ? 24 : 16;
    viewport.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
  };

  return (
    <section className="relative bg-[var(--color-bg)]">
      <div className="px-[var(--space-header-x)] pt-[var(--space-section-y)]">
        <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
          Lookbook
        </p>
        <h2 className="mt-2 max-w-xl text-[length:var(--text-2xl)] font-semibold md:text-[length:var(--text-3xl)]">
          New pieces. Same attitude.
        </h2>
      </div>
      <div
        className={`lookbook-stage mt-10 pb-[var(--space-section-y)] ${paused ? 'is-paused' : ''}`}
        onMouseEnter={() => {
          if (!reduced) pause(true);
        }}
        onMouseLeave={() => {
          if (!reduced) pause(false);
        }}
        onFocus={() => {
          if (!reduced) pause(true);
        }}
        onBlur={(event) => {
          if (!reduced && !event.currentTarget.contains(event.relatedTarget)) pause(false);
        }}
      >
        <div ref={viewportRef} className={reduced ? 'overflow-x-auto' : 'lookbook-viewport'}>
          <div
            ref={trackRef}
            className={`lookbook-track ${reduced ? 'lookbook-track-static px-[var(--space-header-x)]' : ''}`}
          >
            {frames.map((look, index) => (
              <Look key={`${look.label}-${index}`} look={look} hidden={!reduced && index >= LOOKS.length} />
            ))}
          </div>
        </div>
        <NavButton className="lookbook-nav-prev" label="Previous look" onClick={() => (reduced ? scrollStatic(-1) : step(1))}>
          <CaretLeft size={22} weight="bold" />
        </NavButton>
        <NavButton className="lookbook-nav-next" label="Next look" onClick={() => (reduced ? scrollStatic(1) : step(-1))}>
          <CaretRight size={22} weight="bold" />
        </NavButton>
      </div>
    </section>
  );
}
