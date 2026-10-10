import { Link } from 'react-router-dom';
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

/** Continuous lookbook strip. The sequence is duplicated so the loop has no gap. */
export function LookbookCarousel() {
  const reduced = prefersReducedMotion();
  const frames = reduced ? LOOKS : [...LOOKS, ...LOOKS];

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
        className={`mt-10 pb-[var(--space-section-y)] ${
          reduced ? 'overflow-x-auto' : 'lookbook-viewport'
        }`}
      >
        <div className={`lookbook-track ${reduced ? 'lookbook-track-static px-[var(--space-header-x)]' : ''}`}>
          {frames.map((look, index) => (
            <Look key={`${look.label}-${index}`} look={look} hidden={!reduced && index >= LOOKS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
