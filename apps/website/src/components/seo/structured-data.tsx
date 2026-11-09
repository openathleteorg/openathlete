import {
  CONTACT_EMAIL,
  DISCORD_URL,
  GITHUB_URL,
  SITE_URL,
  SUPPORTER_MONTHLY_EUR,
  SUPPORTER_YEARLY_EUR,
} from '@/config';
import { type SupportedLocale, htmlLang, localizedUrl } from '@/utils/locales';

/** JSON-LD, rendered in the HTML so crawlers read it without JavaScript. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...data })
          // A closing tag inside a string would end the script element
          .replace(/</g, '\\u003c'),
      }}
    />
  );
}

export function OrganizationStructuredData() {
  return (
    <JsonLd
      data={{
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'OpenAthlete',
        url: SITE_URL,
        logo: `${SITE_URL}/logo_dark.png`,
        email: CONTACT_EMAIL,
        foundingLocation: 'Grenoble, France',
        sameAs: [GITHUB_URL, DISCORD_URL],
      }}
    />
  );
}

export function WebSiteStructuredData({ locale }: { locale: SupportedLocale }) {
  return (
    <JsonLd
      data={{
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'OpenAthlete',
        url: localizedUrl(locale),
        inLanguage: htmlLang(locale),
        publisher: { '@id': `${SITE_URL}/#organization` },
      }}
    />
  );
}

/** The product, with its real prices: free, and the Supporter plan. */
export function SoftwareApplicationStructuredData({
  locale,
  description,
}: {
  locale: SupportedLocale;
  description: string;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'SoftwareApplication',
        name: 'OpenAthlete',
        url: localizedUrl(locale),
        description,
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web, iOS, Android',
        inLanguage: htmlLang(locale),
        license: 'https://www.gnu.org/licenses/agpl-3.0.html',
        isAccessibleForFree: true,
        publisher: { '@id': `${SITE_URL}/#organization` },
        offers: [
          {
            '@type': 'Offer',
            name: 'Free',
            price: '0',
            priceCurrency: 'EUR',
          },
          {
            '@type': 'Offer',
            name: 'Supporter (monthly)',
            price: String(SUPPORTER_MONTHLY_EUR),
            priceCurrency: 'EUR',
          },
          {
            '@type': 'Offer',
            name: 'Supporter (yearly)',
            price: String(SUPPORTER_YEARLY_EUR),
            priceCurrency: 'EUR',
          },
        ],
      }}
    />
  );
}

export function WebPageStructuredData({
  title,
  description,
  url,
  locale = 'en',
}: {
  title: string;
  description: string;
  url: string;
  locale?: SupportedLocale;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'WebPage',
        name: title,
        description,
        url,
        inLanguage: htmlLang(locale),
        isPartOf: { '@id': `${SITE_URL}/#website` },
      }}
    />
  );
}

export function FAQPageStructuredData({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
  url?: string;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
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
    <JsonLd
      data={{
        '@type': 'BreadcrumbList',
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

/** Kept for the pages that still pass a type and a payload. */
export function StructuredData({
  type,
  data,
}: {
  type: string;
  data: Record<string, unknown>;
}) {
  return <JsonLd data={{ '@type': type, ...data }} />;
}

/** A blog post. `inLanguage` is the language the body is written in. */
export function BlogPostingStructuredData({
  title,
  description,
  url,
  image,
  publishedAt,
  updatedAt,
  authorName,
  inLanguage,
  keywords,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
  authorName: string;
  inLanguage: SupportedLocale;
  keywords?: string[];
}) {
  return (
    <JsonLd
      data={{
        '@type': 'BlogPosting',
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        ...(image && { image }),
        datePublished: publishedAt,
        dateModified: updatedAt ?? publishedAt,
        inLanguage: htmlLang(inLanguage),
        ...(keywords?.length && { keywords: keywords.join(', ') }),
        author: {
          '@type': 'Organization',
          name: authorName,
          url: SITE_URL,
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      }}
    />
  );
}

/** A list of pages, for hubs (blog index, training plans). */
export function ItemListStructuredData({
  name,
  items,
}: {
  name: string;
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'ItemList',
        name,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      }}
    />
  );
}

/** A free calculator that runs in the browser. */
export function WebApplicationStructuredData({
  name,
  description,
  url,
  locale,
}: {
  name: string;
  description: string;
  url: string;
  locale: SupportedLocale;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'WebApplication',
        name,
        description,
        url,
        inLanguage: htmlLang(locale),
        applicationCategory: 'SportsApplication',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        publisher: { '@id': `${SITE_URL}/#organization` },
      }}
    />
  );
}

/** A training plan page: an article about an exercise plan. */
export function TrainingPlanStructuredData({
  title,
  description,
  url,
  locale,
  sport,
  weeks,
  sessionsPerWeek,
}: {
  title: string;
  description: string;
  url: string;
  locale: SupportedLocale;
  sport: string;
  weeks: number;
  sessionsPerWeek: number;
}) {
  return (
    <JsonLd
      data={{
        '@type': 'Article',
        headline: title,
        description,
        url,
        inLanguage: htmlLang(locale),
        isAccessibleForFree: true,
        publisher: { '@id': `${SITE_URL}/#organization` },
        about: {
          '@type': 'ExercisePlan',
          name: title,
          exerciseType: sport,
          activityDuration: `P${weeks}W`,
          activityFrequency: `${sessionsPerWeek} sessions per week`,
        },
      }}
    />
  );
}
