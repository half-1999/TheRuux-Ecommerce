import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mood } from '../../lib/media';
import { EASE, prefersReducedMotion } from '../../animations/motion';

gsap.registerPlugin(ScrollTrigger);

const SLIDES = [mood.hero, mood.udbhav, mood.bestsellers, mood.grid[0], mood.grid[2]];

/** Mixkit free-use clip: a woman choosing a dress in a clothing store. CMS mediaUrl replaces this when set. */
const PUBLIC_HERO_VIDEO = '/hero/dresses.mp4';

export function HeroSection({ section }) {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const cmsVideo =
    section?.mediaUrl && section.mediaUrl !== '/hero/hero.mp4' ? section.mediaUrl : '';
  const videoUrl = videoFailed || section?.mediaType === 'image' ? '' : cmsVideo || PUBLIC_HERO_VIDEO;

  useEffect(() => {
    if (prefersReducedMotion() || videoUrl) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [videoUrl]);

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current || !mediaRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaRef.current,
        { yPercent: 0, scale: 1.12 },
        {
          yPercent: 12,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#0b0d0c] text-[#F5F2EC]"
    >
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        {videoUrl ? (
          <video
            key={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={mood.hero}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          >
            <source src={videoUrl} />
          </video>
        ) : (
          <AnimatePresence mode="sync">
            <motion.img
              key={SLIDES[index]}
              src={SLIDES[index]}
              alt=""
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 0.72, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: EASE }}
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
          </AnimatePresence>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[var(--container)] px-[var(--space-header-x)] pb-16 pt-28 md:pb-24">
        <motion.img
          src="/brand/logo.png"
          alt="TheRuux"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="h-25 w-auto object-contain brightness-0 invert"
        />
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE, delay: 0.12 }}
          className="font-[family-name:var(--font-script)] text-[clamp(3rem,8vw,6.5rem)] leading-[0.9]"
        >
          Beyond Boundaries.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.28 }}
          className="mt-5 max-w-md text-sm text-white/70 md:text-base"
        >
          Minimal on the surface. Personality in the details.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.4 }}
          className="mt-10"
        >
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center gap-2 border border-white/45 px-6 py-2.5 text-sm font-medium tracking-wide text-[#F5F2EC] hover:bg-[#F5F2EC] hover:text-[#141414] active:scale-[0.98]"
          >
            <span>Explore</span>

            <span
              className="inline-flex h-7 w-7 items-center justify-center border border-[#5F6F64]/40"
              aria-hidden
            >
              <ArrowRight size={16} weight="bold" />
            </span>
          </Link>

        </motion.div>

        {!videoUrl ? (
          <div className="mt-10 flex gap-2" aria-hidden>
            {SLIDES.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1 transition-all ${i === index ? 'w-10 bg-[#F5F2EC]' : 'w-4 bg-white/35'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
