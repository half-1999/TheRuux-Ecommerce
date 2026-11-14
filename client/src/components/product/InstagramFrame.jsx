import { instagramEmbed } from '../../lib/instagram';

export function InstagramFrame({ url, title }) {
  const target = instagramEmbed(url);
  if (!target) return null;
  return (
    <iframe
      src={target.embed}
      title={title || 'Instagram post'}
      loading="lazy"
      className="block w-full border-0 bg-white"
      style={{ height: target.kind === 'reel' ? 740 : 620 }}
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
