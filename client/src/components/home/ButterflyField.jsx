import { useEffect, useRef } from 'react';
import './ButterflyField.css';

const BUTTERFLIES = [
  { id: 'a', className: 'butterfly-a', flutter: '1.05s', speed: 0.46, ampX: 78, ampY: 36, phase: 0.4, rot: 7 },
  { id: 'b', className: 'butterfly-b', flutter: '0.82s', speed: 0.34, ampX: 96, ampY: 54, phase: 2.1, rot: -9 },
  { id: 'c', className: 'butterfly-c', flutter: '1.2s', speed: 0.55, ampX: 64, ampY: 72, phase: 4.2, rot: 6 },
  { id: 'd', className: 'butterfly-d', flutter: '0.96s', speed: 0.4, ampX: 88, ampY: 48, phase: 1.2, rot: -6 },
  { id: 'e', className: 'butterfly-e', flutter: '1.28s', speed: 0.62, ampX: 70, ampY: 60, phase: 3.4, rot: 8 },
  { id: 'f', className: 'butterfly-f', flutter: '0.9s', speed: 0.38, ampX: 110, ampY: 42, phase: 5.1, rot: -7 },
];

function ButterflyMark() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <g className="bf-wing bf-wing-l">
        <path d="M38 38 C24 14 6 16 9 34 C12 48 24 47 38 41" fill="#d8e0da" stroke="#103020" strokeWidth="0.7" />
        <path d="M38 42 C24 50 10 64 22 70 C34 74 40 56 38 44" fill="#5f6f64" stroke="#103020" strokeWidth="0.6" opacity="0.9" />
      </g>
      <g className="bf-wing bf-wing-r">
        <path d="M42 38 C56 14 74 16 71 34 C68 48 56 47 42 41" fill="#d7e8de" stroke="#103020" strokeWidth="0.7" />
        <path d="M42 42 C56 50 70 64 58 70 C46 74 40 56 42 44" fill="#1c4332" stroke="#103020" strokeWidth="0.6" opacity="0.72" />
      </g>
      <path d="M40 30 C40.6 38 40.6 50 40 64" stroke="#103020" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="27" r="1.7" fill="#103020" />
      <path d="M40 28 C36 22 32 20 30 18" stroke="#103020" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M40 28 C44 22 48 20 50 18" stroke="#103020" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ButterflyField() {
  const rootRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const root = rootRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 640px)');
    if (!root || motion.matches) return undefined;

    const nodes = nodesRef.current.filter(Boolean);
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let energy = 0;
    let target = 0;
    let idleTimer = 0;
    let scale = narrow.matches ? 0.42 : 1;

    const paint = (amount) => {
      for (let i = 0; i < nodes.length; i += 1) {
        const spec = BUTTERFLIES[i];
        const node = nodes[i];
        const local = elapsed * spec.speed + spec.phase;
        const x = (Math.sin(local) * spec.ampX + Math.sin(local * 0.47) * spec.ampX * 0.28) * amount * scale;
        const y = (Math.cos(local * 0.82) * spec.ampY + Math.sin(local * 1.25) * 12) * amount * scale;
        const rot = Math.sin(local * 0.9) * spec.rot * amount;
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }
    };

    const frame = (now) => {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      energy += (target - energy) * Math.min(1, dt * 2.1);

      if (target === 0 && energy < 0.012) {
        energy = 0;
        paint(0);
        root.classList.remove('is-flying');
        raf = 0;
        last = 0;
        return;
      }

      paint(energy);
      raf = window.requestAnimationFrame(frame);
    };

    const ensure = () => {
      if (!raf) raf = window.requestAnimationFrame(frame);
    };

    const onScroll = () => {
      target = 1;
      root.classList.add('is-flying');
      ensure();
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        target = 0;
      }, 240);
    };

    const onResize = () => {
      scale = narrow.matches ? 0.42 : 1;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(idleTimer);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="butterfly-field" aria-hidden="true">
      {BUTTERFLIES.map((butterfly, index) => (
        <div
          key={butterfly.id}
          ref={(node) => {
            nodesRef.current[index] = node;
          }}
          className={`butterfly ${butterfly.className}`}
          style={{ '--flutter': butterfly.flutter }}
        >
          <ButterflyMark />
        </div>
      ))}
    </div>
  );
}
