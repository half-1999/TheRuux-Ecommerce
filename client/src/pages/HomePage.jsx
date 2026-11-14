import { Fragment, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { catalogApi } from '../api/client';
import { HeroSection } from '../components/home/HeroSection';
import { NewArrivalsSection } from '../components/home/NewArrivalsSection';
import { LookbookCarousel } from '../components/home/LookbookCarousel';
import { UdbhavSection } from '../components/home/UdbhavSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { BestsellersSection } from '../components/home/BestsellersSection';
import { InstagramSection } from '../components/home/InstagramSection';
import { NewsletterSection } from '../components/home/NewsletterSection';
import { LeafField } from '../components/home/LeafField';

/** Default order; CMS sortOrder overrides it. */
const DEFAULT_ORDER = ['hero', 'new_arrivals', 'lookbook', 'udbhav', 'categories', 'bestsellers', 'instagram', 'newsletter'];

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: catalogApi.homepage,
    retry: 1,
  });

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    refresh();
    const id = window.setTimeout(refresh, 350);
    window.addEventListener('load', refresh);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('load', refresh);
    };
  }, [data, isLoading]);

  const byKey = Object.fromEntries((data?.sections || []).map((s) => [s.key, s]));
  const rank = (key) => byKey[key]?.sortOrder ?? DEFAULT_ORDER.indexOf(key) + 1;
  const keys = [...DEFAULT_ORDER].sort((a, b) => rank(a) - rank(b)).filter((key) => byKey[key]?.isActive !== false);
  // Live fields only. Drafts never reach this payload. An empty field keeps the designed line.
  const copy = (key) => byKey[key] || null;

  const render = {
    hero: () => <HeroSection section={byKey.hero} copy={copy('hero')} />,
    new_arrivals: () => <NewArrivalsSection products={data?.newArrivals} loading={isLoading} copy={copy('new_arrivals')} />,
    lookbook: () => <LookbookCarousel looks={copy('lookbook')?.config?.images} copy={copy('lookbook')} />,
    udbhav: () => <UdbhavSection collection={data?.udbhav} copy={copy('udbhav')} />,
    categories: () => <CategoriesSection categories={data?.categories} loading={isLoading} copy={copy('categories')} />,
    bestsellers: () => <BestsellersSection copy={copy('bestsellers')} />,
    instagram: () => <InstagramSection links={data?.instagram?.links} copy={copy('instagram')} />,
    newsletter: () => <NewsletterSection copy={copy('newsletter')} />,
  };

  return (
    <>
      <LeafField />
      {keys.map((key) => (
        <Fragment key={key}>{render[key]()}</Fragment>
      ))}
    </>
  );
}
