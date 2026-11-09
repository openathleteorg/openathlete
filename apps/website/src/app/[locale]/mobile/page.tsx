import { shots } from '@/assets/screenshots';
import { faqEntries, msg } from '@/components/features/helpers';
import { ArrowLink } from '@/components/features/kit';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { AndroidIcon, AppleIcon, GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { PhoneShot } from '@/components/site/visuals/screenshot';
import { GITHUB_URL, GOOGLE_PLAY_URL } from '@/config';
import { initLocale } from '@/i18n/server';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  AlarmClock,
  ArrowRight,
  Bell,
  ChevronRight,
  Globe,
  Server,
  Watch,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/mobile';
const RELEASES_URL = `${GITHUB_URL}/releases`;

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.mobile_seo_title(),
    description: m.mobile_seo_description(),
  });
}

function StatusCard({
  icon,
  name,
  state,
  body,
  live,
  action,
}: {
  icon: ReactNode;
  name: string;
  state: string;
  body: string;
  live?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border p-5',
        live ? 'border-mint/50 bg-mint/[0.07]' : 'border-border bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          {icon}
          {name}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium',
            live
              ? 'bg-mint/30 text-mint-strong'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          {state}
        </span>
      </div>
      <p className="mt-3 text-[0.9rem] leading-snug text-muted-foreground">
        {body}
      </p>
      {action}
    </div>
  );
}

function Steps({
  title,
  icon,
  steps,
}: {
  title: string;
  icon: ReactNode;
  steps: string[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-8">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold">
        {icon}
        {title}
      </h3>
      <ol className="mt-6 grid gap-5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-[0.8rem] text-white">
              {index + 1}
            </span>
            <span className="pt-1 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function MobilePage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('mobile_faq', 5);

  const features = [
    { shot: shots.mobileHome, alt: m.mobile_shot_alt_home(), n: 1 },
    { shot: shots.mobileCalendar, alt: m.mobile_shot_alt_calendar(), n: 2 },
    { shot: shots.mobileActivity, alt: m.mobile_shot_alt_activity(), n: 3 },
    { shot: shots.mobileChat, alt: m.mobile_shot_alt_chat(), n: 4 },
  ];

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.features_crumb_home(), url: localizedUrl(locale, '') },
          { name: m.mobile_crumb(), url: localizedUrl(locale, PATH) },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute top-[-10rem] right-[5%] h-[34rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mint)_22%,transparent),transparent)] blur-2xl" />
          <div className="absolute top-[10rem] left-[-8rem] h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_22%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1 text-[0.82rem] text-muted-foreground">
              <li>
                <Link href={localePath(locale, '')} className="hover:text-ink">
                  {m.features_crumb_home()}
                </Link>
              </li>
              <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              <li className="text-ink" aria-current="page">
                {m.mobile_crumb()}
              </li>
            </ol>
          </nav>
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="kicker flex items-center gap-2 text-sky-strong">
                <AppleIcon className="size-3.5" />
                <AndroidIcon className="size-3.5" />
                {m.mobile_kicker()}
              </p>
              <h1 className="display-1 mt-4">{m.mobile_title()}</h1>
              <p className="lead mt-6 max-w-xl">{m.mobile_lead()}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={signupUrl('mobile_hero')}
                  event="cta_clicked"
                  properties={{ placement: 'mobile_hero', cta: 'signup' }}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.site_cta_start()}
                  <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
                </TrackedLink>
                <TrackedLink
                  href={GOOGLE_PLAY_URL}
                  event="cta_clicked"
                  properties={{ placement: 'mobile_hero', cta: 'google_play' }}
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  <AndroidIcon className="size-4 text-mint-strong" />
                  {m.mobile_cta_play()}
                </TrackedLink>
              </div>
            </div>
            <Reveal
              delay={0.1}
              className="relative mx-auto h-[26rem] w-full max-w-[30rem] sm:h-[34rem] lg:col-span-6"
            >
              <PhoneShot
                src={shots.mobileCalendar}
                alt={m.mobile_shot_alt_calendar()}
                className="absolute top-12 left-0 w-[38%] -rotate-6"
              />
              <PhoneShot
                src={shots.mobileHome}
                alt={m.mobile_shot_alt_home()}
                priority
                className="absolute top-0 left-1/2 z-10 w-[44%] -translate-x-1/2"
              />
              <PhoneShot
                src={shots.mobileWorkout}
                alt={m.mobile_shot_alt_workout()}
                className="absolute top-12 right-0 w-[38%] rotate-6"
              />
            </Reveal>
          </div>
        </Container>
      </section>

      <Section tone="paper" className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid gap-4 md:grid-cols-3">
            <RevealItem>
              <StatusCard
                live
                icon={<Globe className="size-5" />}
                name={m.mobile_status_web()}
                state={m.mobile_status_web_state()}
                body={m.mobile_status_web_body()}
              />
            </RevealItem>
            <RevealItem>
              <StatusCard
                icon={<AppleIcon className="size-5" />}
                name={m.mobile_status_ios()}
                state={m.mobile_status_soon()}
                body={m.mobile_status_ios_body()}
              />
            </RevealItem>
            <RevealItem>
              <StatusCard
                live
                icon={<AndroidIcon className="size-5 text-mint-strong" />}
                name={m.mobile_status_android()}
                state={m.mobile_status_android_state()}
                body={m.mobile_status_android_body()}
                action={
                  <TrackedLink
                    href={GOOGLE_PLAY_URL}
                    event="cta_clicked"
                    properties={{
                      placement: 'mobile_status',
                      cta: 'google_play',
                    }}
                    className="mt-3 inline-flex items-center gap-1 text-[0.9rem] font-medium text-mint-strong hover:underline"
                  >
                    {m.mobile_cta_play()}
                    <ArrowRight className="size-3.5" />
                  </TrackedLink>
                }
              />
            </RevealItem>
          </RevealGroup>
          <Reveal className="mt-6 flex flex-col gap-5 rounded-3xl border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold">
                {m.mobile_watch_title()}
              </h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {m.mobile_watch_body()}
              </p>
            </div>
            <TrackedLink
              href={RELEASES_URL}
              event="mobile_waitlist_clicked"
              properties={{
                placement: 'mobile_status',
                cta: 'github_releases',
              }}
              className={buttonStyles({ variant: 'primary' })}
            >
              <GithubIcon />
              {m.mobile_watch_cta()}
            </TrackedLink>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            kicker={m.mobile_today_kicker()}
            title={m.mobile_today_title()}
            lead={m.mobile_today_lead()}
          />
          <RevealGroup className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
            {features.map(({ shot, alt, n }) => (
              <RevealItem key={n}>
                <div className="h-56 overflow-hidden rounded-[1.5rem] bg-paper px-4 pt-4 sm:h-80 sm:rounded-[2rem] sm:px-8 sm:pt-8">
                  <PhoneShot
                    src={shot}
                    alt={alt}
                    className="mx-auto w-full max-w-[13rem]"
                  />
                </div>
                <h3 className="mt-6 font-semibold">
                  {msg(`mobile_f${n}_title`)}
                </h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {msg(`mobile_f${n}_body`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="paper" id="install">
        <Container>
          <SectionHeading
            kicker={m.mobile_install_kicker()}
            title={m.mobile_install_title()}
            lead={m.mobile_install_lead()}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <Steps
                icon={<AppleIcon className="size-5" />}
                title={m.mobile_ios_title()}
                steps={[m.mobile_ios_1(), m.mobile_ios_2(), m.mobile_ios_3()]}
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Steps
                icon={<AndroidIcon className="size-5 text-mint-strong" />}
                title={m.mobile_android_title()}
                steps={[
                  m.mobile_android_1(),
                  m.mobile_android_2(),
                  m.mobile_android_3(),
                ]}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="kicker text-ink-soft">{m.mobile_native_kicker()}</p>
              <h2 className="display-2-side mt-3 text-white">
                {m.mobile_native_title()}
              </h2>
            </div>
            <RevealGroup className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:col-span-7">
              {[Bell, AlarmClock, AppleIcon, Server].map((Icon, index) => (
                <RevealItem key={index} className="bg-ink p-6">
                  <Icon className="size-5 text-mint" />
                  <p className="mt-4 leading-relaxed text-white/80">
                    {msg(`mobile_native_${index + 1}`)}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-white p-7">
              <Watch className="size-5 text-sky-strong" />
              <h2 className="display-3 mt-4">{m.mobile_watchapp_title()}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m.mobile_watchapp_body()}
              </p>
              <ArrowLink
                href={localePath(locale, '/features/watch-sync')}
                className="mt-6"
              >
                {m.mobile_watchapp_link()}
              </ArrowLink>
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-3xl border border-dashed border-ink/20 p-7"
            >
              <WifiOff className="size-5 text-coral-strong" />
              <h2 className="display-3 mt-4">{m.mobile_offline_title()}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m.mobile_offline_body()}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.features_faq_title()}</h2>
          <Faq items={faqs} placement="mobile" />
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="mobile_final"
        title={m.mobile_final_title()}
        body={m.mobile_final_body()}
      />
    </>
  );
}
