import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CostCalculator } from '@/components/site/cost-calculator';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { CoffeeIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { PricingPlans } from '@/components/site/pricing-plans';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import {
  BUY_ME_A_COFFEE_URL,
  SITE_URL,
  SUPPORTER_MONTHLY_EUR,
  SUPPORTER_YEARLY_EUR,
} from '@/config';
import { formatPrice } from '@/content/pricing';
import { initLocale } from '@/i18n/server';
import { supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  type SupportedLocale,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { Code2, Heart, KeyRound, Server, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';
import { AthletePrices } from './athlete-prices';
import { FeatureTable } from './feature-table';
import { CheckList, faqEntries } from './page-kit';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/pricing',
    title: m.pricing_page_seo_title(),
    description: m.pricing_page_seo_description(),
  });
}

/** The plans as offers, with their billing period, for search engines. */
function PricingStructuredData({ locale }: { locale: SupportedLocale }) {
  const url = localizedUrl(locale, '/pricing');
  const supporter = (price: number, duration: 'P1M' | 'P1Y', name: string) => ({
    '@type': 'Offer',
    name,
    url,
    price: String(price),
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'EUR',
      valueAddedTaxIncluded: true,
      billingDuration: duration,
    },
  });
  return (
    <JsonLd
      data={{
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: 'OpenAthlete',
        url: localizedUrl(locale),
        description: m.pricing_page_seo_description(),
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
            url,
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
          supporter(SUPPORTER_MONTHLY_EUR, 'P1M', 'Supporter (monthly)'),
          supporter(SUPPORTER_YEARLY_EUR, 'P1Y', 'Supporter (yearly)'),
          {
            '@type': 'Offer',
            name: 'Self-hosted',
            url,
            price: '0',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
        ],
      }}
    />
  );
}

export default async function PricingPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const intl = DATE_LOCALES[locale];
  const faqs = faqEntries('pricing_page_faq', 9);
  const free = formatPrice(0, 'EUR', intl);
  const perMonth = formatPrice(
    Math.round((SUPPORTER_YEARLY_EUR / 12) * 100) / 100,
    'EUR',
    intl,
  );

  return (
    <>
      <PricingStructuredData locale={locale} />
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.pricing_page_breadcrumb(),
            url: localizedUrl(locale, '/pricing'),
          },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      {/* Hero and plans */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]" />
          <div className="absolute top-[-14rem] left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_22%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="kicker text-orchid-strong">
              {m.pricing_page_hero_kicker()}
            </p>
            <h1 className="display-1 mt-5">{m.pricing_page_hero_title()}</h1>
            <p className="lead mx-auto mt-6 max-w-2xl">
              {m.pricing_page_hero_lead()}
            </p>
          </div>
          <div className="mt-14">
            <PricingPlans placement="pricing" showCoffee={false} />
          </div>
        </Container>
      </section>

      {/* Coaches: Supporter yearly */}
      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">
                {m.pricing_page_coach_kicker()}
              </p>
              <h2 className="display-2-side mt-4 text-white">
                {m.pricing_page_coach_title()}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                {m.pricing_page_coach_body()}
              </p>
              <div className="mt-8 flex items-end gap-3">
                <p className="text-6xl font-semibold tracking-[-0.04em] text-white tabular-nums">
                  {perMonth}
                </p>
                <p className="pb-2 text-[0.9rem] text-white/60">
                  {m.pricing_page_coach_monthly()}
                </p>
              </div>
              <CheckList
                tone="light"
                className="mt-7"
                items={[
                  m.pricing_page_coach_points_1(),
                  m.pricing_page_coach_points_2(),
                  m.pricing_page_coach_points_3(),
                ]}
              />
              <TrackedLink
                href={supporterUrl('pricing_coach')}
                event="supporter_clicked"
                properties={{ placement: 'pricing_coach', period: 'yearly' }}
                className={buttonStyles({
                  variant: 'light',
                  size: 'lg',
                  className: 'mt-9',
                })}
              >
                <Heart className="fill-coral text-coral" />
                {m.pricing_page_coach_cta()}
              </TrackedLink>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <CostCalculator placement="pricing" tone="dark" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Feature table */}
      <Section>
        <Container>
          <SectionHeading
            kicker={m.pricing_page_table_kicker()}
            title={m.pricing_page_table_title()}
            lead={m.pricing_page_table_lead()}
            align="center"
          />
          <Reveal className="mt-12">
            <FeatureTable
              prices={[free, m.pricing_page_cell_supporter_price(), free]}
            />
          </Reveal>
        </Container>
      </Section>

      {/* AI: your key or ours */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.pricing_page_ai_kicker()}
            title={m.pricing_page_ai_title()}
            align="center"
          />
          <RevealGroup className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            <RevealItem className="rounded-3xl border border-border bg-white p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-sky/20 text-sky-strong">
                <KeyRound className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
                {m.pricing_page_ai_byok_title()}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m.pricing_page_ai_byok_body()}
              </p>
            </RevealItem>
            <RevealItem className="rounded-3xl border border-border bg-white p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-orchid/20 text-orchid-strong">
                <Sparkles className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
                {m.pricing_page_ai_included_title()}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m.pricing_page_ai_included_body()}
              </p>
            </RevealItem>
          </RevealGroup>
          <p className="mt-8 text-center text-[0.92rem] text-muted-foreground">
            {m.pricing_page_ai_note()}
          </p>
        </Container>
      </Section>

      {/* Athletes' prices elsewhere */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading
                size="side"
                kicker={m.pricing_page_athletes_kicker()}
                title={m.pricing_page_athletes_title()}
                lead={m.pricing_page_athletes_lead()}
              />
              <p className="mt-6 text-[0.92rem] text-muted-foreground">
                <Link
                  href={localePath(locale, '/compare')}
                  className="font-medium text-ink underline underline-offset-4 hover:no-underline"
                >
                  {m.site_footer_all_comparisons()}
                </Link>
              </p>
            </div>
            <div className="lg:col-span-8">
              <AthletePrices locale={locale} heading={false} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Where the money goes, and the coffee */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.pricing_page_where_kicker()}
            title={m.pricing_page_where_title()}
          />
          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <Server />,
                title: m.pricing_page_where_1_title(),
                body: m.pricing_page_where_1_body(),
                accent: 'bg-sky/20 text-sky-strong',
              },
              {
                icon: <Sparkles />,
                title: m.pricing_page_where_2_title(),
                body: m.pricing_page_where_2_body(),
                accent: 'bg-orchid/20 text-orchid-strong',
              },
              {
                icon: <Code2 />,
                title: m.pricing_page_where_3_title(),
                body: m.pricing_page_where_3_body(),
                accent: 'bg-coral/20 text-coral-strong',
              },
            ].map((item) => (
              <RevealItem
                key={item.title}
                className="rounded-3xl border border-border bg-white p-7"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl [&_svg]:size-5 ${item.accent}`}
                >
                  {item.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-10">
            <div className="flex flex-col items-start gap-6 rounded-3xl bg-[#fff6c2] p-7 sm:flex-row sm:items-center sm:p-9">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#ffdd00] text-ink">
                <CoffeeIcon className="size-7" />
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold tracking-[-0.02em]">
                  {m.pricing_page_coffee_title()}
                </h3>
                <p className="mt-1.5 text-ink/70">
                  {m.pricing_page_coffee_body()}
                </p>
              </div>
              <TrackedLink
                href={BUY_ME_A_COFFEE_URL}
                event="donation_clicked"
                properties={{ placement: 'pricing_coffee' }}
                className={buttonStyles({ variant: 'primary', size: 'lg' })}
              >
                <CoffeeIcon />
                {m.plans_coffee_cta()}
              </TrackedLink>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.pricing_page_faq_title()}</h2>
          <Faq items={faqs} placement="pricing" />
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="pricing_final"
        title={m.pricing_page_final_title()}
        body={m.pricing_page_final_body()}
        secondary={{
          href: localePath(locale, '/coaches'),
          label: m.site_nav_coaches(),
        }}
      />
    </>
  );
}
