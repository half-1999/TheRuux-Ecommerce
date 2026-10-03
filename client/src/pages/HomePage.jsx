import { useEffect } from 'react';
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
import { ButterflyField } from '../components/home/ButterflyField';

/**
 * Homepage order (PDF / Doc 02):
 * 01 Hero → 02 New Arrivals → Lookbook → 03 Udbhav → 04 Categories →
 * 05 Bestsellers → 06 Instagram → 07 Newsletter → 08 Footer (layout)
 */
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

  return (
    <>
      <ButterflyField />
      <HeroSection section={data?.sections?.find((section) => section.key === 'hero')} />
      <NewArrivalsSection products={data?.newArrivals} loading={isLoading} />
      <LookbookCarousel />
      <UdbhavSection collection={data?.udbhav} />
      <CategoriesSection categories={data?.categories} />
      <BestsellersSection />
      <InstagramSection links={data?.instagram?.links} />
      <NewsletterSection copy={data?.newsletter} />
    </>
  );
}
