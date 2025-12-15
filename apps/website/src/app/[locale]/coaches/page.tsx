import {
  Footer,
  Navbar,
  TopBar,
} from '@/components/landing/sections';
import { CoachesHero } from '@/components/landing/sections/coaches/hero';
import { CoachesBenefits } from '@/components/landing/sections/coaches/benefits';
import { CoachesFeatures } from '@/components/landing/sections/coaches/features';
import { CoachesStats } from '@/components/landing/sections/coaches/stats';
import { CoachesTestimonials } from '@/components/landing/sections/coaches/testimonials';
import { CoachesWorkflow } from '@/components/landing/sections/coaches/workflow';
import { CoachesCTA } from '@/components/landing/sections/coaches/cta';
import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../metadata';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({ locale, path: '/coaches' });
}
/* eslint-enable react-refresh/only-export-components */

export default async function CoachesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  return (
    <>
      <WebPageStructuredData
        title={m.coaches_seo_title()}
        description={m.coaches_seo_description()}
        url={`${SITE_URL}/${locale}/coaches`}
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <CoachesHero />
        <CoachesBenefits />
        <CoachesWorkflow />
        <CoachesFeatures />
        <CoachesStats />
        <CoachesTestimonials />
        <CoachesCTA />
        <Footer />
      </div>
    </>
  );
}

