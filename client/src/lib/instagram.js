const SHORTCODE = /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;
const REEL = /instagram\.com\/(?:reel|reels|tv)\//i;

/** Public post or reel permalink → embeddable frame. Tracking query strings are dropped. */
export function instagramEmbed(url) {
  const raw = String(url || '');
  const match = raw.match(SHORTCODE);
  if (!match) return null;
  const code = match[1];
  const reel = REEL.test(raw);
  const path = reel ? 'reel' : 'p';
  return {
    kind: reel ? 'reel' : 'post',
    href: `https://www.instagram.com/${path}/${code}/`,
    embed: `https://www.instagram.com/${path}/${code}/embed`,
  };
}
