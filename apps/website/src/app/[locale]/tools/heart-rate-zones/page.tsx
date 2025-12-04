import { Footer } from '@/components/landing/sections/footer';
import { Navbar } from '@/components/landing/sections/navbar';
import { TopBar } from '@/components/landing/sections/topbar';
import {
  SoftwareApplicationStructuredData,
  WebPageStructuredData,
} from '@/components/seo/structured-data';
import { HeartRateZones } from '@/components/tools/heart-rate-zones';
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
    title: m.tool_heart_rate_title(),
    description: m.tool_heart_rate_description(),
    path: '/tools/heart-rate-zones',
    keywords: [
      'heart rate zones',
      'zones cardiaques',
      'Karvonen formula',
      'formule Karvonen',
      'heart rate calculator',
      'calculateur fréquence cardiaque',
      'training zones',
      "zones d'entraînement",
      'target heart rate',
      'fréquence cardiaque cible',
      'aerobic base',
      'endurance fondamentale',
      'fat burning zone',
      'zone brûlage graisses',
    ],
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function HeartRateZonesPage({
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
        title={m.tool_heart_rate_title()}
        description={m.tool_heart_rate_description()}
        url={`${SITE_URL}/${locale}/tools/heart-rate-zones`}
      />
      <SoftwareApplicationStructuredData
        name={m.tool_heart_rate_title()}
        description={m.tool_heart_rate_description()}
        url={`${SITE_URL}/${locale}/tools/heart-rate-zones`}
        applicationCategory="HealthApplication"
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <main className="py-16">
          <HeartRateZones />
        </main>
        <Footer />
      </div>
    </>
  );
}
