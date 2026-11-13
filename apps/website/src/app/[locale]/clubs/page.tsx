import { shots } from '@/assets/screenshots';
import { SplitRow } from '@/components/features/kit';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { SELF_HOSTING_DOCS_URL } from '@/config';
import {
  COACH_PRICING,
  type Currency,
  PRICES_CHECKED_ON,
  formatPrice,
} from '@/content/pricing';
import { initLocale } from '@/i18n/server';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  formatLongDate,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  FolderOpen,
  MessagesSquare,
  Server,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
  Watch,
} from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';
import { CheckList, PHOTOS, Photo, faqEntries } from '../pricing/page-kit';
import { InstallTerminal } from '../pricing/terminal';

type Props = { params: Promise<{ locale: string }> };

const NOLIO_PRICING_URL = 'https://www.nolio.io/en/pricing';
const TP_COACH_PRICING_URL =
  'https://www.trainingpeaks.com/pricing/for-coaches/';

/**
 * A club of 50 athletes and 3 coaches, per year, at the list prices of
 * PRICES_CHECKED_ON (market study, section 2.5C).
 */
const CLUB_ATHLETES = 50;
// Club Starter: €29.90 for 40 athletes and 2 coaches, €0.50 per extra
// athlete, €12 a month for the third coach
const NOLIO_CLUB_STARTER = Math.round((29.9 + 10 * 0.5 + 12) * 12 * 100) / 100;
// Club Classic: €49.90, 80 athletes and 3 coaches included
const NOLIO_CLUB_CLASSIC = Math.round(49.9 * 12 * 100) / 100;
// Coach Edition with Basic athletes: $54.99 a month from 5 athletes
const TP_BASIC = Math.round(54.99 * 12 * 100) / 100;

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/clubs',
    title: m.clubspage_seo_title(),
    description: m.clubspage_seo_description(),
  });
}

export default async function ClubsPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const intl = DATE_LOCALES[locale];
  const faqs = faqEntries('clubspage_faq', 5);
  const tpPremium =
    COACH_PRICING.find((vendor) => vendor.id === 'trainingpeaks')?.yearly(
      CLUB_ATHLETES,
    ) ?? 0;

  const costs: Array<{
    name: string;
    note: string;
    amount: number;
    label: string;
    currency: Currency;
    ours?: boolean;
  }> = [
    {
      name: m.clubspage_cost_oa_self(),
      note: m.clubspage_cost_oa_self_note(),
      amount: 0,
      label: formatPrice(0, 'EUR', intl),
      currency: 'EUR',
      ours: true,
    },
    {
      name: m.clubspage_cost_oa_cloud(),
      note: m.clubspage_cost_oa_cloud_note(),
      amount: 0,
      label: formatPrice(0, 'EUR', intl),
      currency: 'EUR',
      ours: true,
    },
    {
      name: 'Nolio Club Starter',
      note: m.clubspage_cost_nolio_starter_note(),
      amount: NOLIO_CLUB_STARTER,
      label: formatPrice(NOLIO_CLUB_STARTER, 'EUR', intl),
      currency: 'EUR',
    },
    {
      name: 'Nolio Club Classic',
      note: m.clubspage_cost_nolio_classic_note(),
      amount: NOLIO_CLUB_CLASSIC,
      label: formatPrice(NOLIO_CLUB_CLASSIC, 'EUR', intl),
      currency: 'EUR',
    },
    {
      name: m.clubspage_cost_tp_basic(),
      note: m.clubspage_cost_tp_basic_note(),
      amount: TP_BASIC,
      label: formatPrice(TP_BASIC, 'USD', intl),
      currency: 'USD',
    },
    {
      name: m.clubspage_cost_tp_premium(),
      note: m.clubspage_cost_tp_premium_note(),
      amount: tpPremium,
      label: formatPrice(tpPremium, 'USD', intl),
      currency: 'USD',
    },
  ];
  const max = Math.max(...costs.map((row) => row.amount));

  const today = [
    {
      icon: <ShieldCheck />,
      title: m.clubspage_today_1_title(),
      body: m.clubspage_today_1_body(),
    },
    {
      icon: <UserPlus />,
      title: m.clubspage_today_2_title(),
      body: m.clubspage_today_2_body(),
    },
    {
      icon: <Users />,
      title: m.clubspage_today_3_title(),
      body: m.clubspage_today_3_body(),
    },
    {
      icon: <FolderOpen />,
      title: m.clubspage_today_4_title(),
      body: m.clubspage_today_4_body(),
    },
    {
      icon: <MessagesSquare />,
      title: m.clubspage_today_7_title(),
      body: m.clubspage_today_7_body(),
    },
    {
      icon: <Watch />,
      title: m.clubspage_today_9_title(),
      body: m.clubspage_today_9_body(),
    },
  ];

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.clubspage_breadcrumb(),
            url: localizedUrl(locale, '/clubs'),
          },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      {/* Hero, on the photo */}
      <section className="pt-3 sm:pt-5">
        <Container size="wide" className="px-3 sm:px-5">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-5 pt-16 pb-16 sm:px-12 sm:pt-24 sm:pb-24 lg:px-16">
            <Photo
              src={PHOTOS.groupRun}
              alt={m.clubspage_hero_photo_alt()}
              priority
              sizes="100vw"
              width={2400}
              height={1350}
              className="absolute inset-0 h-full w-full object-[50%_70%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
            <div className="relative max-w-2xl">
              <p className="kicker text-sky">{m.clubspage_hero_kicker()}</p>
              <h1 className="display-1 mt-5 text-white">
                {m.clubspage_hero_title()}
              </h1>
              <p className="lead mt-6 text-white/75">
                {m.clubspage_hero_lead()}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={signupUrl(
                    'clubs_hero',
                    '/dashboard/settings?tab=clubs',
                  )}
                  event="cta_clicked"
                  properties={{ placement: 'clubs_hero', cta: 'signup' }}
                  className={buttonStyles({
                    variant: 'light',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.clubspage_hero_cta_create()}
                  <ArrowRight />
                </TrackedLink>
                <a
                  href="#own-server"
                  className={buttonStyles({
                    variant: 'outlineLight',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  <Server />
                  {m.clubspage_hero_cta_server()}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* In the app */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.clubspage_app_kicker()}
            title={m.clubspage_app_title()}
            align="center"
          />
          <div className="mt-16 grid gap-24">
            <SplitRow
              as="h3"
              title={m.clubspage_today_6_title()}
              body={m.clubspage_today_6_body()}
              visual={
                <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                  <Screenshot
                    src={shots.clubSessions}
                    alt={m.clubspage_shot_sessions()}
                    sizes="(min-width: 1024px) 600px, 85vw"
                  />
                  <PhoneShot
                    src={shots.mobileClubSession}
                    alt={m.clubspage_shot_session_phone()}
                    sizes="(min-width: 1024px) 200px, 30vw"
                    className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                  />
                </div>
              }
            />
            <SplitRow
              as="h3"
              flip
              title={m.clubspage_today_5_title()}
              body={m.clubspage_today_5_body()}
              visual={
                <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                  <Screenshot
                    src={shots.planForGroup}
                    alt={m.clubspage_shot_plan()}
                    sizes="(min-width: 1024px) 600px, 85vw"
                  />
                  <PhoneShot
                    src={shots.mobilePlanForGroup}
                    alt={m.clubspage_shot_plan_phone()}
                    sizes="(min-width: 1024px) 200px, 30vw"
                    className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                  />
                </div>
              }
            />
            <SplitRow
              as="h3"
              title={m.clubspage_today_8_title()}
              body={m.clubspage_today_8_body()}
              visual={
                <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                  <Screenshot
                    src={shots.clubDashboard}
                    alt={m.clubspage_shot_dashboard()}
                    sizes="(min-width: 1024px) 600px, 85vw"
                  />
                  <PhoneShot
                    src={shots.mobileBroadcast}
                    alt={m.clubspage_shot_broadcast_phone()}
                    sizes="(min-width: 1024px) 200px, 30vw"
                    className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                  />
                </div>
              }
            />
          </div>
        </Container>
      </Section>

      {/* Two ways */}
      <Section>
        <Container>
          <SectionHeading
            kicker={m.clubspage_ways_kicker()}
            title={m.clubspage_ways_title()}
            align="center"
          />
          <RevealGroup className="mt-14 grid items-stretch gap-5 lg:grid-cols-2">
            <RevealItem className="flex h-full flex-col rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="kicker text-sky-strong">
                {m.clubspage_way1_label()}
              </p>
              <h3 className="display-3 mt-4">{m.clubspage_way1_title()}</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.clubspage_way1_body()}
              </p>
              <CheckList
                className="mt-7"
                items={[
                  m.clubspage_way1_point_1(),
                  m.clubspage_way1_point_2(),
                  m.clubspage_way1_point_3(),
                  m.clubspage_way1_point_4(),
                ]}
              />
              <div className="flex-1" />
              <Link
                href={localePath(locale, '/coaches')}
                className="mt-8 inline-flex items-center gap-1.5 font-medium hover:text-sky-strong"
              >
                {m.site_nav_coaches()}
                <ArrowRight className="size-4" />
              </Link>
            </RevealItem>
            <RevealItem className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-ink p-7 text-white shadow-[0_40px_80px_-30px_rgb(5_12_52/0.7)] sm:p-9">
              <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-orchid/25 blur-3xl"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <p className="kicker text-ink-soft">
                  {m.clubspage_way2_label()}
                </p>
                <span className="flex items-center gap-1 rounded-full bg-mint/20 px-2.5 py-1 text-[0.72rem] font-medium text-mint">
                  <Star className="size-3 fill-mint" />
                  {m.clubspage_way2_badge()}
                </span>
              </div>
              <h3 className="display-3 relative mt-4 text-white">
                {m.clubspage_way2_title()}
              </h3>
              <p className="relative mt-4 leading-relaxed text-white/70">
                {m.clubspage_way2_body()}
              </p>
              <CheckList
                tone="light"
                className="relative mt-7"
                items={[
                  m.clubspage_way2_point_1(),
                  m.clubspage_way2_point_2(),
                  m.clubspage_way2_point_3(),
                  m.clubspage_way2_point_4(),
                  m.clubspage_way2_point_5(),
                ]}
              />
              <p className="relative mt-7 rounded-2xl bg-white/[0.06] p-4 text-[0.85rem] leading-relaxed text-white/60">
                {m.clubspage_way2_honest()}
              </p>
            </RevealItem>
          </RevealGroup>
        </Container>
      </Section>

      {/* The club's server */}
      <Section tone="paper" id="own-server">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.clubspage_server_kicker()}
                title={m.clubspage_server_title()}
                lead={m.clubspage_server_body()}
              />
              <ol className="mt-8 grid gap-4">
                {[
                  m.clubspage_server_step_1(),
                  m.clubspage_server_step_2(),
                  m.clubspage_server_step_3(),
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-3.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-[0.75rem] text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={SELF_HOSTING_DOCS_URL}
                  event="self_host_clicked"
                  properties={{ placement: 'clubs_server' }}
                  className={buttonStyles()}
                >
                  <Server />
                  {m.plans_selfhost_cta()}
                </TrackedLink>
                <Link
                  href={localePath(locale, '/open-source')}
                  className={buttonStyles({ variant: 'secondary' })}
                >
                  {m.clubspage_server_more()}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <InstallTerminal domain="training.yourclub.org" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Cost of a club of 50 */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading
                size="side"
                kicker={m.clubspage_cost_kicker()}
                title={m.clubspage_cost_title()}
                lead={m.clubspage_cost_lead()}
              />
            </div>
            <Reveal delay={0.1} className="lg:col-span-8">
              <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)] sm:p-7">
                <ul className="grid gap-5">
                  {costs.map((row) => (
                    <li key={row.name}>
                      <div className="flex items-baseline justify-between gap-4">
                        <p
                          className={cn(
                            'font-medium',
                            row.ours && 'font-semibold',
                          )}
                        >
                          {row.name}
                        </p>
                        <p
                          className={cn(
                            'shrink-0 text-lg font-medium tabular-nums',
                            row.ours &&
                              'text-xl font-semibold text-mint-strong',
                          )}
                        >
                          {row.label}
                          <span className="ml-1 text-[0.75rem] font-normal text-muted-foreground">
                            {m.clubspage_cost_year()}
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            row.ours
                              ? 'bg-mint-strong'
                              : 'bg-gradient-to-r from-coral to-coral-strong',
                          )}
                          style={{
                            width:
                              row.amount === 0
                                ? '0.375rem'
                                : `${Math.max((row.amount / max) * 100, 1.5)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                        {row.note}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[0.75rem] leading-relaxed text-muted-foreground">
                  {m.cost_footnote({
                    date: formatLongDate(PRICES_CHECKED_ON, locale),
                  })}{' '}
                  {m.cost_sources()}:{' '}
                  <a
                    href={NOLIO_PRICING_URL}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    Nolio
                  </a>
                  ,{' '}
                  <a
                    href={TP_COACH_PRICING_URL}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    TrainingPeaks
                  </a>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* What exists today */}
      <Section>
        <Container>
          <SectionHeading
            kicker={m.clubspage_today_kicker()}
            title={m.clubspage_today_title()}
          />
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {today.map((item) => (
              <RevealItem
                key={item.title}
                className="bg-white p-7 [&_svg]:size-5 [&_svg]:text-sky-strong"
              >
                {item.icon}
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-[0.94rem] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="paper">
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.clubspage_faq_title()}</h2>
          <Faq items={faqs} placement="clubs" />
        </Container>
      </Section>

      <div className="pt-10">
        <CtaBand
          locale={locale}
          placement="clubs_final"
          title={m.clubspage_final_title()}
          body={m.clubspage_final_body()}
        />
      </div>
    </>
  );
}
