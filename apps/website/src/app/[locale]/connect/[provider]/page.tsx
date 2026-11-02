import {
  ProviderCapabilities,
  ProviderHero,
  ProviderTutorial,
} from '@/components/connect';
import { Footer, Navbar, TopBar } from '@/components/landing/sections';
import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { isSupportedLocale, localePrefix } from '@/utils/locales';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../../metadata';

const VALID_PROVIDERS = [
  'garmin',
  'strava',
  'suunto',
  'polar',
  'coros',
] as const;
type ProviderSlug = (typeof VALID_PROVIDERS)[number];

function isValidProvider(provider: string): provider is ProviderSlug {
  return VALID_PROVIDERS.includes(provider as ProviderSlug);
}

function toProviderEnum(
  provider: ProviderSlug,
): 'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR' | 'COROS' {
  return provider.toUpperCase() as
    'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR' | 'COROS';
}

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}) {
  const { locale, provider } = await params;

  if (!isValidProvider(provider)) {
    return {};
  }

  const key = provider.toLowerCase();
  const titleKey = `connect_${key}_seo_title` as keyof typeof m;
  const descriptionKey = `connect_${key}_seo_description` as keyof typeof m;
  const title = (m[titleKey] as () => string)();
  const description = (m[descriptionKey] as () => string)();

  return generatePageMetadata({
    locale,
    title,
    description,
    path: `/connect/${provider}`,
  });
}

export default async function ConnectProviderPage({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}) {
  const { locale, provider } = await params;

  // Validate locale
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Validate provider
  if (!isValidProvider(provider)) {
    notFound();
  }

  const providerEnum = toProviderEnum(provider);

  return (
    <>
      <WebPageStructuredData
        title={(
          m[`connect_${provider}_seo_title` as keyof typeof m] as () => string
        )()}
        description={(
          m[
            `connect_${provider}_seo_description` as keyof typeof m
          ] as () => string
        )()}
        url={`${SITE_URL}${localePrefix(locale)}/connect/${provider}`}
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <ProviderHero provider={providerEnum} />
        <ProviderCapabilities provider={providerEnum} />
        <ProviderTutorial provider={providerEnum} />
        <Footer />
      </div>
    </>
  );
}
