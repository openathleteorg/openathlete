import {
  Footer,
  Navbar,
  TopBar,
} from '@/components/landing/sections';
import { ClubsHero } from '@/components/landing/sections/clubs/hero';
import { ClubsBenefits } from '@/components/landing/sections/clubs/benefits';
import { ClubsFeatures } from '@/components/landing/sections/clubs/features';
import { ClubsStats } from '@/components/landing/sections/clubs/stats';
import { ClubsTestimonials } from '@/components/landing/sections/clubs/testimonials';
import { ClubsWorkflow } from '@/components/landing/sections/clubs/workflow';
import { ClubsCTA } from '@/components/landing/sections/clubs/cta';
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
  return generatePageMetadata({ locale, path: '/clubs' });
}
/* eslint-enable react-refresh/only-export-components */

export default async function ClubsPage({
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
        title={m.clubs_seo_title()}
        description={m.clubs_seo_description()}
        url={`${SITE_URL}/${locale}/clubs`}
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <ClubsHero />
        <ClubsBenefits />
        <ClubsWorkflow />
        <ClubsFeatures />
        <ClubsStats />
        <ClubsTestimonials />
        <ClubsCTA />
        <Footer />
      </div>
    </>
  );
}

