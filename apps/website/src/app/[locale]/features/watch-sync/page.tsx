import { faqEntries, msg } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  RelatedFeatures,
} from '@/components/features/kit';
import {
  type Cell,
  type MatrixRow,
  SyncFlow,
  SyncMatrix,
} from '@/components/features/sync-visuals';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { PROVIDERS } from '@/components/site/providers';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import {
  ArrowRight,
  CalendarDays,
  FileUp,
  Server,
  Webhook,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/watch-sync';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_sync_seo_title(),
    description: m.features_sync_seo_description(),
  });
}

const STATES: Record<string, Cell['state'][]> = {
  strava: ['yes', 'yes', 'no', 'no'],
  garmin: ['yes', 'partial', 'yes', 'yes'],
  polar: ['yes', 'no', 'yes', 'no'],
  suunto: ['yes', 'partial', 'yes', 'yes'],
  coros: ['yes', 'yes', 'yes', 'yes'],
};

export default async function WatchSyncPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_sync_faq', 6);
  const na: Cell = { state: 'na', text: m.features_sync_na() };

  const brandRows: MatrixRow[] = (
    ['garmin', 'coros', 'suunto', 'polar', 'strava'] as const
  ).map((slug) => ({
    name: PROVIDERS.find((p) => p.slug === slug)!.name,
    slug,
    href: localePath(locale, `/connect/${slug}`),
    cells: (['a', 'h', 'w', 'o'] as const).map((col, index) => ({
      state: STATES[slug][index],
      text: msg(`features_sync_${slug}_${col}`),
    })),
  }));
  const rows: MatrixRow[] = [
    ...brandRows,
    {
      name: m.features_sync_files_name(),
      icon: <FileUp className="size-4" />,
      cells: [{ state: 'yes', text: m.features_sync_files_a() }, na, na, na],
    },
    {
      name: m.features_sync_api_name(),
      icon: <Webhook className="size-4" />,
      cells: [{ state: 'yes', text: m.features_sync_api_a() }, na, na, na],
    },
    {
      name: m.features_sync_ical_name(),
      icon: <CalendarDays className="size-4" />,
      cells: [na, na, na, { state: 'yes', text: m.features_sync_ical_o() }],
    },
  ];

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_sync_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_sync_hero"
        crumb={m.features_nav_sync_title()}
        kicker={m.features_sync_kicker()}
        title={m.features_sync_title()}
        lead={m.features_sync_lead()}
        proofs={[
          m.features_sync_proof_1(),
          m.features_sync_proof_2(),
          m.features_sync_proof_3(),
        ]}
        secondary={{ href: '#matrix', label: m.features_sync_secondary() }}
        visual={
          <SyncFlow
            labels={{
              in: m.features_sync_flow_in(),
              out: m.features_sync_flow_out(),
              files: m.features_sync_flow_files(),
              api: m.features_sync_flow_api(),
              calendar: m.features_sync_flow_calendar(),
            }}
          />
        }
      />

      <Section tone="paper" id="matrix">
        <Container size="wide">
          <SectionHeading
            kicker={m.features_sync_matrix_kicker()}
            title={m.features_sync_matrix_title()}
            lead={m.features_sync_matrix_lead()}
          />
          <Reveal className="mt-12">
            <SyncMatrix
              columns={[
                m.features_sync_col_activities(),
                m.features_sync_col_history(),
                m.features_sync_col_wellness(),
                m.features_sync_col_workouts(),
              ]}
              rows={rows}
            />
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            kicker={m.features_sync_brands_kicker()}
            title={m.features_sync_brands_title()}
          />
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(['garmin', 'coros', 'suunto', 'polar', 'strava'] as const).map(
              (slug) => {
                const provider = PROVIDERS.find((p) => p.slug === slug)!;
                return (
                  <RevealItem key={slug}>
                    <Link
                      href={localePath(locale, `/connect/${slug}`)}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(5_12_52/0.35)]"
                    >
                      <span className="flex h-7 items-center justify-between">
                        <Image
                          src={provider.logo}
                          alt={provider.name}
                          width={Math.round((provider.width / 128) * 18)}
                          height={18}
                          unoptimized
                          className="h-[18px] w-auto"
                        />
                        {slug === 'coros' && (
                          <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[0.68rem] font-medium text-mint-strong">
                            {m.features_sync_new()}
                          </span>
                        )}
                      </span>
                      <p className="mt-4 text-[0.9rem] leading-snug text-muted-foreground">
                        {msg(`features_sync_brand_${slug}`)}
                      </p>
                      <span className="mt-auto pt-4">
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                      </span>
                    </Link>
                  </RevealItem>
                );
              },
            )}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">
                {m.features_sync_pipe_kicker()}
              </p>
              <h2 className="display-2-side mt-3 text-white">
                {m.features_sync_pipe_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-white/70">
                {m.features_sync_pipe_body()}
              </p>
            </Reveal>
            <RevealGroup className="relative grid gap-2 lg:col-span-7">
              <span
                aria-hidden
                className="absolute top-4 bottom-4 left-[1.15rem] w-px bg-gradient-to-b from-sky via-orchid to-coral opacity-60"
              />
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <RevealItem
                  key={n}
                  className="relative flex items-center gap-4 rounded-xl px-1 py-2"
                >
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-ink font-mono text-[0.75rem] text-white">
                    {n}
                  </span>
                  <span className="text-white/85">
                    {msg(`features_sync_pipe_${n}`)}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="kicker text-sky-strong">
                {m.features_sync_team_kicker()}
              </p>
              <h2 className="display-3 mt-3">{m.features_sync_team_title()}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.features_sync_team_body()}
              </p>
              <ArrowLink href={localePath(locale, '/coaches')} className="mt-6">
                {m.features_sync_team_link()}
              </ArrowLink>
            </Reveal>
            <Reveal delay={0.1} className="ink-band rounded-3xl p-7 sm:p-9">
              <p className="kicker text-ink-soft">
                {m.features_sync_neutral_kicker()}
              </p>
              <h2 className="display-3 mt-3 text-white">
                {m.features_sync_neutral_title()}
              </h2>
              <p className="mt-4 leading-relaxed text-white/70">
                {m.features_sync_neutral_body()}
              </p>
              <ArrowLink
                tone="light"
                href={localePath(locale, '/compare/trainingpeaks')}
                className="mt-6"
              >
                {m.features_sync_neutral_link()}
              </ArrowLink>
            </Reveal>
          </div>
          <Reveal className="mt-6 flex gap-4 rounded-3xl border border-dashed border-ink/20 p-6 sm:p-7">
            <Server className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">{m.features_sync_self_title()}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                {m.features_sync_self_body()}
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_sync"
      />
      <RelatedFeatures locale={locale} current="sync" />
      <CtaBand
        locale={locale}
        placement="features_sync_final"
        title={m.features_sync_final_title()}
        body={m.features_sync_final_body()}
      />
    </>
  );
}
