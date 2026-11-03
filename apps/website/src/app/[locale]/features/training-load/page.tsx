import { shots } from '@/assets/screenshots';
import { faqEntries } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  RelatedFeatures,
} from '@/components/features/kit';
import { FormGauge, ProjectionChart } from '@/components/features/load-visuals';
import { TrimpCalculator } from '@/components/features/trimp-calculator';
import { CtaBand } from '@/components/site/cta-band';
import { GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { FitnessChart } from '@/components/site/visuals/fitness-chart';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { DOCS_URL, GITHUB_URL } from '@/config';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { ArrowUpRight, BookOpen, FileCode2 } from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/training-load';
const HELPER_URL = `${GITHUB_URL}/blob/main/apps/api/src/modules/core/helpers/training-load.ts`;
const CONSTANTS_URL = `${GITHUB_URL}/blob/main/apps/api/src/common/constants/training-formulas.constants.ts`;
const SCIENCE_URL = `${DOCS_URL}/docs/guides/statistics-science`;

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_tl_seo_title(),
    description: m.features_tl_seo_description(),
  });
}

export default async function TrainingLoadPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_tl_faq', 5);

  const curves = [
    {
      name: m.features_tl_ctl_name(),
      tag: m.features_tl_ctl_tag(),
      body: m.features_tl_ctl_body(),
      color: '#2f7fe0',
      formula: 'CTL += (1 − e^(−1/42)) × (load − CTL)',
    },
    {
      name: m.features_tl_atl_name(),
      tag: m.features_tl_atl_tag(),
      body: m.features_tl_atl_body(),
      color: '#d05ab4',
      formula: 'ATL += (1 − e^(−1/7)) × (load − ATL)',
    },
    {
      name: m.features_tl_tsb_name(),
      tag: m.features_tl_tsb_tag(),
      body: m.features_tl_tsb_body(),
      color: '#12a594',
      formula: 'TSB = CTL − ATL',
    },
  ];

  const files = [
    {
      href: HELPER_URL,
      icon: FileCode2,
      name: 'helpers/training-load.ts',
      body: m.features_tl_open_file_1(),
      event: 'github_clicked' as const,
    },
    {
      href: CONSTANTS_URL,
      icon: FileCode2,
      name: 'constants/training-formulas.constants.ts',
      body: m.features_tl_open_file_2(),
      event: 'github_clicked' as const,
    },
    {
      href: SCIENCE_URL,
      icon: BookOpen,
      name: 'docs › statistics-science',
      body: m.features_tl_open_file_3(),
      event: 'cta_clicked' as const,
    },
  ];

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_load_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_load_hero"
        crumb={m.features_nav_load_title()}
        kicker={m.features_tl_kicker()}
        title={m.features_tl_title()}
        lead={m.features_tl_lead()}
        proofs={[
          m.features_tl_proof_1(),
          m.features_tl_proof_2(),
          m.features_tl_proof_3(),
        ]}
        secondary={{ href: '#formulas', label: m.features_tl_secondary() }}
        visual={
          <div className="shot p-5 sm:p-7">
            <FitnessChart
              labels={{
                fitness: m.features_tl_fitness(),
                fatigue: m.features_tl_fatigue(),
                form: m.features_tl_form(),
                race: m.features_tl_race(),
              }}
            />
          </div>
        }
      />

      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.features_tl_curves_kicker()}
            title={m.features_tl_curves_title()}
            lead={m.features_tl_curves_lead()}
          />
          <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
            {curves.map((curve) => (
              <RevealItem
                key={curve.tag}
                className="flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-7"
              >
                <span
                  className="h-1 w-10 rounded-full"
                  style={{ background: curve.color }}
                />
                <h3 className="display-3 mt-5">{curve.name}</h3>
                <p className="mt-1 font-mono text-[0.75rem] text-muted-foreground">
                  {curve.tag}
                </p>
                <p className="mt-4 flex-1 leading-relaxed text-ink/80">
                  {curve.body}
                </p>
                <p className="mt-6 overflow-x-auto rounded-xl bg-paper px-3 py-2.5 font-mono text-[0.75rem] whitespace-nowrap text-ink/80">
                  {curve.formula}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-8 max-w-3xl border-l-2 border-sky/60 pl-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            {m.features_tl_formula_note()}
          </Reveal>
        </Container>
      </Section>

      <Section tone="ink" id="trimp">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">
                {m.features_tl_trimp_kicker()}
              </p>
              <h2 className="display-2-side mt-3 text-white">
                {m.features_tl_trimp_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-white/70">
                {m.features_tl_trimp_body()}
              </p>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#030824] p-4 font-mono text-[0.78rem] leading-7 text-white/80">
                <p className="whitespace-nowrap">
                  TRIMP = min × HRr × <span className="text-sky">y</span> × e^(
                  <span className="text-sky">k</span> × HRr)
                </p>
                <p className="whitespace-nowrap text-white/50">
                  HRr = (HR − HRrest) / (HRmax − HRrest)
                </p>
              </div>
              <p className="mt-4 text-[0.9rem] text-white/55">
                {m.features_tl_trimp_coeffs()}
              </p>
              <p className="mt-2 text-[0.9rem] text-white/55">
                {m.features_tl_trimp_needs()}
              </p>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <TrimpCalculator
                labels={{
                  duration: m.features_tl_calc_duration(),
                  avgHr: m.features_tl_calc_hr(),
                  hrMax: m.features_tl_calc_hrmax(),
                  hrRest: m.features_tl_calc_hrrest(),
                  male: m.features_tl_calc_male(),
                  female: m.features_tl_calc_female(),
                  result: m.features_tl_calc_result(),
                  reserve: m.features_tl_calc_reserve(),
                  minutes: m.features_tl_calc_minutes(),
                }}
              />
              <div className="mt-5 rounded-2xl border border-white/10 p-5">
                <h3 className="font-semibold text-white">
                  {m.features_tl_rpe_title()}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-white/65">
                  {m.features_tl_rpe_body()}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-sky-strong">
                {m.features_tl_plan_kicker()}
              </p>
              <h2 className="display-2-side mt-3">
                {m.features_tl_plan_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {m.features_tl_plan_body()}
              </p>
              <h3 className="mt-8 font-semibold">
                {m.features_tl_plan_method_title()}
              </h3>
              <ol className="mt-4 grid gap-3">
                {[
                  m.features_tl_plan_method_1(),
                  m.features_tl_plan_method_2(),
                  m.features_tl_plan_method_3(),
                ].map((method, index) => (
                  <li
                    key={method}
                    className="flex gap-3 text-[0.95rem] leading-relaxed"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-paper font-mono text-[0.72rem]">
                      {index + 1}
                    </span>
                    {method}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="shot p-5 sm:p-7">
                <ProjectionChart
                  labels={{
                    fitness: m.features_tl_fitness(),
                    fatigue: m.features_tl_fatigue(),
                    form: m.features_tl_form(),
                    today: m.features_tl_today(),
                    planned: m.features_tl_planned(),
                    race: m.features_tl_race(),
                  }}
                />
              </div>
              <p className="mt-5 text-[0.9rem] leading-relaxed text-muted-foreground">
                {m.features_tl_weekly()}
              </p>
              <ArrowLink
                href={localePath(locale, '/features/training-calendar')}
                className="mt-4"
              >
                {m.features_nav_calendar_title()}
              </ArrowLink>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="kicker text-sky-strong">
                {m.features_tl_read_kicker()}
              </p>
              <h2 className="display-2-side mt-3">
                {m.features_tl_read_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {m.features_tl_read_body()}
              </p>
              <div className="mt-8 rounded-3xl border border-border bg-white p-5 sm:p-6">
                <FormGauge
                  labels={{
                    heavy: m.features_tl_gauge_heavy(),
                    neutral: m.features_tl_gauge_neutral(),
                    fresh: m.features_tl_gauge_fresh(),
                    note: m.features_tl_gauge_note(),
                  }}
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="kicker text-sky-strong">
                {m.features_tl_diff_kicker()}
              </p>
              <h2 className="display-2-side mt-3">
                {m.features_tl_diff_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {m.features_tl_diff_body()}
              </p>
              <Screenshot
                src={shots.trainingLoad}
                alt={m.features_tl_curves_title()}
                chrome={false}
                className="mt-8"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section id="formulas">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.features_tl_open_kicker()}
                title={m.features_tl_open_title()}
                lead={m.features_tl_open_body()}
              />
              <TrackedLink
                href={GITHUB_URL}
                event="github_clicked"
                properties={{ placement: 'features_load_formulas' }}
                className="mt-7 inline-flex items-center gap-2 font-medium hover:text-sky-strong"
              >
                <GithubIcon className="size-4" />
                openathleteorg/openathlete
              </TrackedLink>
            </div>
            <RevealGroup className="grid gap-3 lg:col-span-7">
              {files.map(({ href, icon: Icon, name, body, event }) => (
                <RevealItem key={href}>
                  <TrackedLink
                    href={href}
                    event={event}
                    properties={{
                      placement: 'features_load_formulas',
                      cta: name,
                    }}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(5_12_52/0.35)]"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[0.85rem] font-medium">
                        {name}
                      </span>
                      <span className="mt-1 block text-[0.92rem] text-muted-foreground">
                        {body}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </TrackedLink>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_load"
      />
      <RelatedFeatures locale={locale} current="load" />
      <CtaBand
        locale={locale}
        placement="features_load_final"
        title={m.features_tl_final_title()}
        body={m.features_tl_final_body()}
      />
    </>
  );
}
