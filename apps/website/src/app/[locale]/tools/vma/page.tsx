import { Footer } from '@/components/landing/sections/footer';
import { Navbar } from '@/components/landing/sections/navbar';
import { TopBar } from '@/components/landing/sections/topbar';
import {
  SoftwareApplicationStructuredData,
  WebPageStructuredData,
} from '@/components/seo/structured-data';
import { VMACalculator } from '@/components/tools/vma-calculator';
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
    title: m.tool_vma_title(),
    description: m.tool_vma_description(),
    path: '/tools/vma',
    keywords: [
      'VMA',
      'vitesse maximale aérobie',
      'maximum aerobic speed',
      'VMA calculator',
      'calculateur VMA',
      'running calculator',
      'calculateur course à pied',
      'training pace',
      'allure entraînement',
      'cooper test',
      'test cooper',
      'demi-cooper test',
      'test demi-cooper',
      'running training',
      'entraînement course à pied',
    ],
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function VMACalculatorPage({
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
        title={m.tool_vma_title()}
        description={m.tool_vma_description()}
        url={`${SITE_URL}/${locale}/tools/vma`}
      />
      <SoftwareApplicationStructuredData
        name={m.tool_vma_title()}
        description={m.tool_vma_description()}
        url={`${SITE_URL}/${locale}/tools/vma`}
        applicationCategory="HealthApplication"
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <main className="py-16">
          <VMACalculator />
        </main>
        <Footer />
      </div>
    </>
  );
}
