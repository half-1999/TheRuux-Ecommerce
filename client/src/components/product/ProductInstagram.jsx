import { Play } from '@phosphor-icons/react';
import { mood } from '../../lib/media';
import { prefersReducedMotion } from '../../animations/motion';

const PROFILE = 'https://www.instagram.com/theruux/';
const VIDEO_FILE = /\.(mp4|webm|mov)(\?|#|$)/i;
const REEL = /instagram\.com\/(reel|reels|tv)\//i;

function isVideoFile(value) {
  return VIDEO_FILE.test(String(value || ''));
}

function buildTiles(product) {
  const links = product?.instagramLinks || [];
  if (links.length) {
    return links.map((link, index) => {
      const href = link.url || PROFILE;
      const thumb =
        link.thumbUrl ||
        product.images?.[index % Math.max(product.images.length, 1)]?.url ||
        mood.grid[index % mood.grid.length];
      return {
        id: link.id || `ig-${index}`,
        href,
        thumb,
        video: isVideoFile(thumb),
        reel: REEL.test(href) || isVideoFile(href) || isVideoFile(thumb),
        caption: link.caption || 'Instagram',
      };
    });
  }

  const photos = [
    ...(product?.images || []).slice(0, 3).map((image) => image.url),
    ...mood.grid,
  ].filter(Boolean);

  return [
    ...photos.slice(0, 5).map((src, index) => ({
      id: `mood-${index}`,
      href: PROFILE,
      thumb: src,
      video: false,
      reel: false,
      caption: 'TheRuux on Instagram',
    })),
    {
      id: 'reel',
      href: PROFILE,
      thumb: '/hero/dresses.mp4',
      video: true,
      reel: true,
      caption: 'TheRuux reel',
    },
  ];
}

export function ProductInstagram({ product }) {
  const tiles = buildTiles(product);
  const reduced = prefersReducedMotion();
  if (!tiles.length) return null;

  return (
    <section className="mt-16 border-t border-[var(--color-border)] pt-12">
      <p className="text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
        Inspiration
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-wide">Seen on Instagram</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Photos and reels for styling. Open any frame on Instagram.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <a
              href={tile.href}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-[4/5] overflow-hidden bg-[var(--color-bg-muted)]"
            >
              {tile.video ? (
                <video
                  src={tile.thumb}
                  muted
                  loop
                  playsInline
                  autoPlay={!reduced}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={tile.thumb}
                  alt={tile.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
                />
              )}
              {tile.reel ? (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[#F5F2EC]">
                  <Play size={12} weight="fill" />
                  Reel
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
