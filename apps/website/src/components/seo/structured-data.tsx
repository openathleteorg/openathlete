import { SITE_URL } from '@/config';
import Script from 'next/script';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'WebPage';
  data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Script
      id={`structured-data-${type.toLowerCase()}`}
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'OpenAthlete',
        url: SITE_URL,
        logo: `${SITE_URL}/logo_dark.png`,
        description:
          'AI-assisted endurance coaching platform for coaches and athletes',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@openathlete.org',
          contactType: 'Customer Service',
        },
        sameAs: [
          // Add social media links here when available
        ],
      }}
    />
  );
}

export function WebSiteStructuredData() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: 'OpenAthlete',
        url: SITE_URL,
        description:
          'AI-assisted endurance coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function WebPageStructuredData({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <StructuredData
      type="WebPage"
      data={{
        name: title,
        description,
        url,
        inLanguage: ['en', 'fr'],
        isPartOf: {
          '@type': 'WebSite',
          name: 'OpenAthlete',
          url: SITE_URL,
        },
      }}
    />
  );
}
