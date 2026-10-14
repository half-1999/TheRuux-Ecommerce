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

/** Default order (PDF / Doc 02); CMS sortOrder overrides it. The lookbook always follows New Arrivals. */
const DEFAULT_ORDER = ['hero', 'new_arrivals', 'udbhav', 'categories', 'bestsellers', 'instagram', 'newsletter'];

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
  // Text only comes from sections published through the CMS; never-published seed rows keep the designed copy.
  const copy = (key) => (byKey[key]?.publishedAt ? byKey[key] : null);

  const render = {
    hero: () => <HeroSection section={byKey.hero} copy={copy('hero')} />,
    new_arrivals: () => (
      <>
        <NewArrivalsSection products={data?.newArrivals} loading={isLoading} copy={copy('new_arrivals')} />
        <LookbookCarousel />
      </>
    ),
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
