import { SITE_URL } from '@/config';
import Script from 'next/script';

interface StructuredDataProps {
  type:
    | 'Organization'
    | 'WebSite'
    | 'WebPage'
    | 'FAQPage'
    | 'BreadcrumbList'
    | 'Article'
    | 'SoftwareApplication';
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

export function FAQPageStructuredData({
  faqs,
  url,
}: {
  faqs: Array<{ question: string; answer: string }>;
  url: string;
}) {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
        url,
        inLanguage: ['en', 'fr'],
      }}
    />
  );
}

export function BreadcrumbListStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function ArticleStructuredData({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  author,
  image,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
  author: { name: string; email?: string };
  image?: string;
}) {
  return (
    <StructuredData
      type="Article"
      data={{
        headline: title,
        description,
        url,
        datePublished: publishedAt,
        dateModified: updatedAt || publishedAt,
        author: {
          '@type': 'Person',
          name: author.name,
          ...(author.email && { email: author.email }),
        },
        publisher: {
          '@type': 'Organization',
          name: 'OpenAthlete',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo_dark.png`,
          },
        },
        ...(image && {
          image: {
            '@type': 'ImageObject',
            url: image.startsWith('http') ? image : `${SITE_URL}${image}`,
          },
        }),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
        inLanguage: ['en', 'fr'],
      }}
    />
  );
}

export function SoftwareApplicationStructuredData({
  name,
  description,
  url,
  applicationCategory = 'HealthApplication',
  operatingSystem = 'Web',
  offers = {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  aggregateRating,
}: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
}) {
  return (
    <StructuredData
      type="SoftwareApplication"
      data={{
        name,
        description,
        url,
        applicationCategory,
        operatingSystem,
        offers,
        ...(aggregateRating && { aggregateRating }),
        publisher: {
          '@type': 'Organization',
          name: 'OpenAthlete',
          url: SITE_URL,
        },
        inLanguage: ['en', 'fr'],
      }}
    />
  );
}
