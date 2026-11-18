import { shots } from '@/assets/screenshots';
import {
  faqEntries,
  msg,
  questionnaireCardLabels,
} from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  RelatedFeatures,
  SplitRow,
} from '@/components/features/kit';
import {
  AnswerCharts,
  QuestionnaireCard,
} from '@/components/features/quest-visuals';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import {
  AlignLeft,
  CircleDot,
  Gauge,
  Hash,
  ListChecks,
  Server,
  TextCursorInput,
  ToggleRight,
} from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/athlete-questionnaires';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_quest_seo_title(),
    description: m.features_quest_seo_description(),
  });
}

const TYPES = [
  { key: 'scale', icon: Gauge },
  { key: 'number', icon: Hash },
  { key: 'yesno', icon: ToggleRight },
  { key: 'one', icon: CircleDot },
  { key: 'many', icon: ListChecks },
  { key: 'short', icon: TextCursorInput },
  { key: 'long', icon: AlignLeft },
] as const;

const TEMPLATES = ['hooper', 'wellness', 'weekly', 'tqr', 'blank'] as const;

export default async function AthleteQuestionnairesPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_quest_faq', 6);

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_quest_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_quest_hero"
        crumb={m.features_nav_quest_title()}
        kicker={m.features_quest_kicker()}
        title={m.features_quest_title()}
        lead={m.features_quest_lead()}
        proofs={[
          m.features_quest_proof_1(),
          m.features_quest_proof_2(),
          m.features_quest_proof_3(),
        ]}
        secondary={{ href: '#templates', label: m.features_quest_secondary() }}
        visual={
          <QuestionnaireCard
            labels={questionnaireCardLabels()}
            className="mx-auto max-w-[30rem]"
          />
        }
      />

      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.features_quest_how_kicker()}
            title={m.features_quest_how_title()}
            lead={m.features_quest_how_lead()}
          />
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <RevealItem
                key={n}
                className="rounded-3xl border border-border bg-white p-6"
              >
                <span className="grid size-9 place-items-center rounded-full bg-ink font-mono text-[0.8rem] text-white">
                  {n}
                </span>
                <h3 className="mt-5 font-semibold">
                  {msg(`features_quest_how_${n}_title`)}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {msg(`features_quest_how_${n}_body`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* In the app */}
      <Section>
        <Container>
          <SectionHeading
            kicker={m.features_quest_app_kicker()}
            title={m.features_quest_app_title()}
            align="center"
          />
          <div className="mt-16 grid gap-24">
            <SplitRow
              as="h3"
              title={m.features_quest_app_1_title()}
              body={m.features_quest_app_1_body()}
              visual={
                <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                  <Screenshot
                    src={shots.questionnaireAnswers}
                    alt={m.features_quest_shot_answers()}
                    sizes="(min-width: 1024px) 600px, 85vw"
                  />
                  <PhoneShot
                    src={shots.mobileQuestionnaire}
                    alt={m.features_quest_shot_answer_phone()}
                    sizes="(min-width: 1024px) 200px, 30vw"
                    className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                  />
                </div>
              }
            />
            <SplitRow
              as="h3"
              flip
              title={m.features_quest_app_2_title()}
              body={m.features_quest_app_2_body()}
              visual={
                <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                  <Screenshot
                    src={shots.questionnaireWeeks}
                    alt={m.features_quest_shot_weeks()}
                    sizes="(min-width: 1024px) 600px, 85vw"
                  />
                  <PhoneShot
                    src={shots.mobileMyQuestionnaires}
                    alt={m.features_quest_shot_mine_phone()}
                    sizes="(min-width: 1024px) 200px, 30vw"
                    className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                  />
                </div>
              }
            />
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.features_quest_types_kicker()}
                title={m.features_quest_types_title()}
                lead={m.features_quest_types_lead()}
              />
            </div>
            <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {TYPES.map(({ key, icon: Icon }) => (
                <RevealItem
                  key={key}
                  className={
                    key === 'scale'
                      ? 'rounded-2xl border border-border bg-white p-5 sm:col-span-2'
                      : 'rounded-2xl border border-border bg-white p-5'
                  }
                >
                  <Icon className="size-5 text-sky-strong" />
                  <h3 className="mt-3 font-semibold">
                    {msg(`features_quest_type_${key}_title`)}
                  </h3>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-muted-foreground">
                    {msg(`features_quest_type_${key}_body`)}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      <Section tone="ink" id="templates">
        <Container>
          <div className="max-w-3xl">
            <p className="kicker text-ink-soft">
              {m.features_quest_tpl_kicker()}
            </p>
            <h2 className="display-2 mt-3 text-white">
              {m.features_quest_tpl_title()}
            </h2>
            <p className="mt-5 leading-relaxed text-white/70">
              {m.features_quest_tpl_lead()}
            </p>
          </div>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TEMPLATES.map((key) => (
              <RevealItem
                key={key}
                className={
                  key === 'blank'
                    ? 'flex flex-col rounded-2xl border border-dashed border-white/20 p-5'
                    : 'flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5'
                }
              >
                <h3 className="font-semibold text-white">
                  {msg(`features_quest_tpl_${key}_name`)}
                </h3>
                <p className="mt-1 font-mono text-[0.72rem] text-ink-soft">
                  {msg(`features_quest_tpl_${key}_source`)}
                </p>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-white/70">
                  {msg(`features_quest_tpl_${key}_body`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-8 max-w-3xl border-l-2 border-mint/60 pl-4 text-[0.95rem] leading-relaxed text-white/60">
            {m.features_quest_tpl_note()}
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            kicker={m.features_quest_read_kicker()}
            title={m.features_quest_read_title()}
            body={m.features_quest_read_body()}
            points={[
              m.features_quest_read_p1(),
              m.features_quest_read_p2(),
              m.features_quest_read_p3(),
            ]}
            visual={
              <AnswerCharts
                labels={{
                  scale: m.features_quest_chart_scale(),
                  yesNo: m.features_quest_chart_yesno(),
                  choice: m.features_quest_chart_choice(),
                  choices: [
                    m.features_quest_chart_choice_1(),
                    m.features_quest_chart_choice_2(),
                    m.features_quest_chart_choice_3(),
                  ],
                  text: m.features_quest_chart_text(),
                  quotes: [
                    m.features_quest_chart_quote_1(),
                    m.features_quest_chart_quote_2(),
                  ],
                }}
              />
            }
          />
          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="kicker text-sky-strong">
                {m.features_quest_score_kicker()}
              </p>
              <h3 className="display-3 mt-3">
                {m.features_quest_score_title()}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.features_quest_score_body()}
              </p>
              <ArrowLink
                href={localePath(locale, '/features/training-load')}
                className="mt-6"
              >
                {m.features_nav_load_title()}
              </ArrowLink>
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-3xl border border-border bg-white p-7 sm:p-9"
            >
              <p className="kicker text-sky-strong">
                {m.features_quest_metrics_kicker()}
              </p>
              <h3 className="display-3 mt-3">
                {m.features_quest_metrics_title()}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.features_quest_metrics_body()}
              </p>
              <ArrowLink
                href={localePath(locale, '/features/watch-sync')}
                className="mt-6"
              >
                {m.features_nav_sync_title()}
              </ArrowLink>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="kicker text-sky-strong">
                {m.features_quest_privacy_kicker()}
              </p>
              <h2 className="display-3 mt-3">
                {m.features_quest_privacy_title()}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.features_quest_privacy_body()}
              </p>
              <ArrowLink href={localePath(locale, '/clubs')} className="mt-6">
                {m.features_hub_club_link()}
              </ArrowLink>
            </Reveal>
            <Reveal delay={0.1} className="ink-band rounded-3xl p-7 sm:p-9">
              <p className="kicker text-ink-soft">
                {m.features_quest_own_kicker()}
              </p>
              <h2 className="display-3 mt-3 text-white">
                {m.features_quest_own_title()}
              </h2>
              <p className="mt-4 leading-relaxed text-white/70">
                {m.features_quest_own_body()}
              </p>
              <ArrowLink
                tone="light"
                href={localePath(locale, '/coaches')}
                className="mt-6"
              >
                {m.features_sync_team_link()}
              </ArrowLink>
            </Reveal>
          </div>
          <Reveal className="mt-6 flex gap-4 rounded-3xl border border-dashed border-ink/20 p-6 sm:p-7">
            <Server className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">{m.features_quest_self_title()}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                {m.features_quest_self_body()}
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_quest"
      />
      <RelatedFeatures locale={locale} current="quest" />
      <CtaBand
        locale={locale}
        placement="features_quest_final"
        title={m.features_quest_final_title()}
        body={m.features_quest_final_body()}
      />
    </>
  );
}
