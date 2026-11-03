import { shots } from '@/assets/screenshots';
import {
  FeedCard,
  SeasonStrip,
  WeekGrid,
} from '@/components/features/calendar-visuals';
import { faqEntries, msg } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  RelatedFeatures,
  SplitRow,
} from '@/components/features/kit';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import {
  CalendarClock,
  ClipboardCopy,
  FileUp,
  LayoutList,
  MoveRight,
  Repeat,
  Search,
  Thermometer,
  Undo2,
} from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/training-calendar';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_cal_seo_title(),
    description: m.features_cal_seo_description(),
  });
}

const TOOL_ICONS = [
  ClipboardCopy,
  MoveRight,
  Undo2,
  Repeat,
  LayoutList,
  FileUp,
  Search,
  CalendarClock,
];

export default async function TrainingCalendarPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_cal_faq', 6);

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_calendar_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        stacked
        placement="features_calendar_hero"
        crumb={m.features_nav_calendar_title()}
        kicker={m.features_cal_kicker()}
        title={m.features_cal_title()}
        lead={m.features_cal_lead()}
        proofs={[
          m.features_cal_proof_1(),
          m.features_cal_proof_2(),
          m.features_cal_proof_3(),
        ]}
        secondary={{
          href: localePath(locale, '/athletes'),
          label: m.features_cal_secondary(),
        }}
        visual={
          <WeekGrid
            labels={{
              days: m.features_cal_days().split(','),
              sessions: {
                threshold: m.features_cal_s_threshold(),
                easy: m.features_cal_s_easy(),
                hills: m.features_cal_s_hills(),
                long: m.features_cal_s_long(),
                race: m.features_cal_s_race(),
                rest: m.features_cal_s_rest(),
                moved: m.features_cal_s_moved(),
              },
              illness: m.features_cal_illness(),
              summary: m.features_cal_summary(),
              done: m.features_cal_done(),
              planned: m.features_cal_planned(),
              load: m.features_cal_load(),
              form: m.features_cal_form(),
              legend: {
                ok: m.features_cal_legend_ok(),
                close: m.features_cal_legend_close(),
                off: m.features_cal_legend_off(),
                missed: m.features_cal_legend_missed(),
              },
            }}
          />
        }
      />

      <Section tone="ink">
        <Container>
          <SplitRow
            tone="light"
            kicker={m.features_cal_season_kicker()}
            title={m.features_cal_season_title()}
            body={m.features_cal_season_body()}
            points={[
              m.features_cal_season_point_1(),
              m.features_cal_season_point_2(),
              m.features_cal_season_point_3(),
            ]}
            visual={
              <SeasonStrip
                labels={{
                  phases: {
                    base: m.features_cal_phase_base(),
                    recovery: m.features_cal_phase_recovery(),
                    specific: m.features_cal_phase_specific(),
                    taper: m.features_cal_phase_taper(),
                  },
                  raceA: m.features_cal_race_a(),
                  raceB: m.features_cal_race_b(),
                  week: m.features_cal_week(),
                  load: m.features_cal_strip_load(),
                }}
              />
            }
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            flip
            kicker={m.features_cal_match_kicker()}
            title={m.features_cal_match_title()}
            body={m.features_cal_match_body()}
            points={[
              m.features_cal_match_point_1(),
              m.features_cal_match_point_2(),
              m.features_cal_match_point_3(),
            ]}
            visual={
              <Screenshot
                src={shots.calendarWeek}
                alt={m.features_cal_match_title()}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            }
          />
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.features_cal_tools_kicker()}
            title={m.features_cal_tools_title()}
            lead={m.features_cal_tools_lead()}
          />
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TOOL_ICONS.map((Icon, index) => (
              <RevealItem key={index} className="bg-white p-6">
                <Icon className="size-5 text-sky-strong" />
                <h3 className="mt-4 font-semibold">
                  {msg(`features_cal_tool_${index + 1}_title`)}
                </h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {msg(`features_cal_tool_${index + 1}_body`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            kicker={m.features_cal_periods_kicker()}
            title={m.features_cal_periods_title()}
            body={
              <>
                <p>{m.features_cal_periods_body()}</p>
                <p className="border-l-2 border-orchid/60 pl-4 text-[0.95rem]">
                  {m.features_cal_periods_note()}{' '}
                  <ArrowLink
                    href={localePath(locale, '/features/mcp-server')}
                    className="text-[0.95rem]"
                  >
                    {m.features_nav_mcp_title()}
                  </ArrowLink>
                </p>
              </>
            }
            visual={
              <div className="relative mx-auto max-w-md">
                <div
                  aria-hidden
                  className="absolute -inset-6 rounded-[2rem] opacity-80"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, rgb(226 88 42 / 0.09) 0 10px, transparent 10px 20px)',
                  }}
                />
                <div className="relative rounded-2xl border border-border bg-white p-6 shadow-[0_30px_60px_-30px_rgb(5_12_52/0.45)]">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="grid size-8 place-items-center rounded-full bg-coral/15 text-coral-strong">
                      <Thermometer className="size-4" />
                    </span>
                    {m.features_cal_dialog_title()}
                  </p>
                  <p className="mt-3 text-[0.95rem] text-muted-foreground">
                    {m.features_cal_dialog_body()}
                  </p>
                  <ul className="mt-4 grid gap-2 text-[0.88rem]">
                    <li className="flex justify-between rounded-lg bg-paper px-3 py-2">
                      <span>{m.features_cal_s_hills()}</span>
                      <span className="font-mono text-muted-foreground">
                        0:55
                      </span>
                    </li>
                    <li className="flex justify-between rounded-lg bg-paper px-3 py-2">
                      <span>{m.features_cal_s_easy()}</span>
                      <span className="font-mono text-muted-foreground">
                        0:40
                      </span>
                    </li>
                  </ul>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <span className="flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[0.88rem] font-medium text-white">
                      {m.features_cal_dialog_move()}
                    </span>
                    <span className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-[0.88rem]">
                      {m.features_cal_dialog_delete()}
                    </span>
                  </div>
                </div>
              </div>
            }
          />
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SplitRow
            flip
            kicker={m.features_cal_coach_kicker()}
            title={m.features_cal_coach_title()}
            body={m.features_cal_coach_body()}
            points={[
              m.features_cal_coach_point_1(),
              m.features_cal_coach_point_2(),
            ]}
            visual={
              <Screenshot
                src={shots.coachAthleteCalendar}
                alt={m.features_cal_coach_title()}
                chrome={false}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            }
          >
            <ArrowLink href={localePath(locale, '/coaches')} className="mt-7">
              {m.features_cal_coach_link()}
            </ArrowLink>
          </SplitRow>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            kicker={m.features_cal_feed_kicker()}
            title={m.features_cal_feed_title()}
            body={m.features_cal_feed_body()}
            visual={
              <FeedCard
                url="https://api.openathlete.org/event/ical?calendar=q3H1v0…"
                events={[
                  {
                    day: m.features_cal_days().split(',')[1],
                    title: m.features_cal_feed_e1_title(),
                    detail: m.features_cal_feed_e1_detail(),
                  },
                  {
                    day: m.features_cal_days().split(',')[5],
                    title: m.features_cal_feed_e2_title(),
                    detail: m.features_cal_feed_e2_detail(),
                  },
                  {
                    day: m.features_cal_days().split(',')[6],
                    title: m.features_cal_feed_e3_title(),
                    detail: m.features_cal_feed_e3_detail(),
                  },
                ]}
              />
            }
          />
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_calendar"
      />
      <RelatedFeatures locale={locale} current="calendar" />
      <CtaBand
        locale={locale}
        placement="features_calendar_final"
        title={m.features_cal_final_title()}
        body={m.features_cal_final_body()}
      />
    </>
  );
}
