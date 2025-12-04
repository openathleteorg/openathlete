import {
  Benefits,
  FAQ,
  Features,
  FinalCTA,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  PilotResults,
  Pricing,
  Problem,
  Providers,
  Science,
  Solution,
  Testimonials,
  TopBar,
} from '@/components/landing/sections';
import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../metadata';

/* eslint-disable react-refresh/only-export-components */
export const metadata = generatePageMetadata();
/* eslint-enable react-refresh/only-export-components */

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  // Locale is already set in the layout

  return (
    <>
      <WebPageStructuredData
        title="OpenAthlete — AI-assisted endurance coaching platform"
        description="OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence."
        url={`${SITE_URL}${locale === 'en' ? '' : `/${locale}`}`}
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Benefits />
        <Features />
        <Providers />
        <Science />
        <PilotResults />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}
