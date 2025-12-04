import { Footer } from '@/components/landing/sections/footer';
import { Navbar } from '@/components/landing/sections/navbar';
import { TopBar } from '@/components/landing/sections/topbar';
import {
  SoftwareApplicationStructuredData,
  WebPageStructuredData,
} from '@/components/seo/structured-data';
import { RacePredictor } from '@/components/tools/race-predictor';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../../metadata';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  return generatePageMetadata({
    locale,
    title: m.tool_race_predictor_title(),
    description: m.tool_race_predictor_description(),
    path: '/tools/race-predictor',
    keywords: [
      'race time predictor',
      'prédicteur temps course',
      'Riegel formula',
      'formule Riegel',
      'marathon time predictor',
      'prédicteur marathon',
      'race pace calculator',
      'calculateur allure course',
      'running time prediction',
      'prédiction temps course',
      'marathon pace',
      'allure marathon',
      'half marathon predictor',
      'prédicteur semi-marathon',
    ],
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function RacePredictorPage({
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
        title={m.tool_race_predictor_title()}
        description={m.tool_race_predictor_description()}
        url={`${SITE_URL}/${locale}/tools/race-predictor`}
      />
      <SoftwareApplicationStructuredData
        name={m.tool_race_predictor_title()}
        description={m.tool_race_predictor_description()}
        url={`${SITE_URL}/${locale}/tools/race-predictor`}
        applicationCategory="HealthApplication"
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <main className="py-16">
          <RacePredictor />
        </main>
        <Footer />
      </div>
    </>
  );
}
