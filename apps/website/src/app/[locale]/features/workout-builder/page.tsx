import { shots } from '@/assets/screenshots';
import { DeviceMatrix, StepTree } from '@/components/features/builder-visuals';
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
import { PROVIDERS } from '@/components/site/providers';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { WorkoutBlocks } from '@/components/site/visuals/workout-blocks';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import {
  Bike,
  CornerDownLeft,
  Dumbbell,
  FileText,
  Folder,
  Footprints,
  Sparkles,
  Waves,
  Wrench,
} from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/workout-builder';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_wb_seo_title(),
    description: m.features_wb_seo_description(),
  });
}

function provider(slug: string) {
  return PROVIDERS.find((p) => p.slug === slug)!;
}

export default async function WorkoutBuilderPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_wb_faq', 6);

  const deviceRows = (
    ['garmin', 'suunto', 'coros', 'polar', 'strava'] as const
  ).map((slug) => ({
    name: provider(slug).name,
    logo: provider(slug).logo,
    logoWidth: provider(slug).width,
    sends: slug === 'garmin' || slug === 'suunto' || slug === 'coros',
    detail: msg(`features_wb_send_${slug}`),
  }));

  const library = [
    {
      folder: m.features_wb_lib_folder_1(),
      color: 'var(--sky)',
      items: [
        m.features_wb_lib_item_1(),
        m.features_wb_lib_item_2(),
        m.features_wb_lib_item_3(),
      ],
    },
    {
      folder: m.features_wb_lib_folder_2(),
      color: 'var(--coral)',
      items: [m.features_wb_lib_item_4(), m.features_wb_lib_item_5()],
    },
    {
      folder: m.features_wb_lib_folder_3(),
      color: 'var(--mint)',
      items: [m.features_wb_lib_item_6()],
    },
  ];

  // As typed in the quick-add field, one line per step
  const typed = ["15' Z2", "6x(1km Z4 / 2' Z1)", "10' Z1"];
  const number = new Intl.NumberFormat(locale);
  const catalog = [
    { value: number.format(1305), label: m.features_wb_strength_count() },
    { value: number.format(262), label: m.features_wb_strength_drawn() },
    { value: '5', label: m.features_wb_strength_languages() },
  ];

  const sports = [
    {
      icon: Footprints,
      title: m.features_wb_sport_run(),
      body: m.features_wb_sport_run_body(),
    },
    {
      icon: Bike,
      title: m.features_wb_sport_bike(),
      body: m.features_wb_sport_bike_body(),
    },
    {
      icon: Waves,
      title: m.features_wb_sport_swim(),
      body: m.features_wb_sport_swim_body(),
    },
    {
      icon: Dumbbell,
      title: m.features_wb_sport_strength(),
      body: m.features_wb_sport_strength_body(),
    },
  ];

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_builder_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_builder_hero"
        crumb={m.features_nav_builder_title()}
        kicker={m.features_wb_kicker()}
        title={m.features_wb_title()}
        lead={m.features_wb_lead()}
        proofs={[
          m.features_wb_proof_1(),
          m.features_wb_proof_2(),
          m.features_wb_proof_3(),
        ]}
        secondary={{
          href: localePath(locale, '/features/watch-sync'),
          label: m.features_wb_secondary(),
        }}
        visual={
          <div className="relative">
            <div className="sm:mr-10">
              <StepTree
                title={m.features_wb_tree_title()}
                meta={m.features_wb_tree_meta()}
                repeatLabel={m.features_wb_repeat()}
                before={[
                  {
                    label: m.features_wb_step_warmup(),
                    duration: '15:00',
                    target: m.features_wb_step_warmup_t(),
                    zone: 1,
                  },
                ]}
                repeat={[
                  {
                    label: m.features_wb_step_work(),
                    duration: '4:00',
                    target: m.features_wb_step_work_t(),
                    zone: 4,
                  },
                  {
                    label: m.features_wb_step_rest(),
                    duration: '2:00',
                    target: m.features_wb_step_rest_t(),
                    zone: 0,
                  },
                ]}
                after={[
                  {
                    label: m.features_wb_step_steady(),
                    duration: '6:00',
                    target: m.features_wb_step_steady_t(),
                    zone: 3,
                  },
                  {
                    label: m.features_wb_step_cool(),
                    duration: '14:00',
                    target: m.features_wb_step_cool_t(),
                    zone: 1,
                  },
                ]}
              />
            </div>
            <WorkoutBlocks
              className="relative z-10 mt-3 ml-auto sm:-mt-6 w-[min(92%,21rem)] sm:-mr-4"
              title={m.features_wb_tree_title()}
              meta={m.features_wb_tree_meta()}
              sentLabel={m.features_wb_sent()}
            />
          </div>
        }
      />

      <Section>
        <Container>
          <SplitRow
            kicker={m.features_wb_type_kicker()}
            title={m.features_wb_type_title()}
            body={m.features_wb_type_body()}
            points={[
              m.features_wb_type_point_1(),
              m.features_wb_type_point_2(),
              m.features_wb_type_point_3(),
            ]}
            visual={
              <div className="relative pb-16 sm:pb-10">
                <Screenshot
                  src={shots.workoutEditor}
                  alt={m.features_wb_type_shot()}
                  chrome={false}
                  sizes="(min-width: 1024px) 680px, 100vw"
                />
                <div className="absolute right-3 -bottom-2 w-[min(88%,18rem)] rounded-2xl border border-border bg-white p-3 shadow-[0_24px_48px_-24px_rgb(5_12_52/0.4)] sm:-right-6 sm:-bottom-6">
                  {typed.map((line) => (
                    <p
                      key={line}
                      className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 font-mono text-[0.82rem] text-ink odd:bg-paper"
                    >
                      {line}
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    </p>
                  ))}
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
            kicker={m.features_wb_strength_kicker()}
            title={m.features_wb_strength_title()}
            body={m.features_wb_strength_body()}
            points={[
              m.features_wb_strength_point_1(),
              m.features_wb_strength_point_2(),
              m.features_wb_strength_point_3(),
            ]}
            visual={
              <div className="relative pb-16 sm:pb-10">
                <Screenshot
                  src={shots.strengthEditor}
                  alt={m.features_wb_strength_shot()}
                  chrome={false}
                  sizes="(min-width: 1024px) 680px, 100vw"
                />
                <dl className="absolute -bottom-2 left-3 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-white py-3 shadow-[0_24px_48px_-24px_rgb(5_12_52/0.4)] sm:-bottom-6 sm:-left-6">
                  {catalog.map(({ value, label }) => (
                    <div key={label} className="px-4 sm:px-5">
                      <dt className="sr-only">{label}</dt>
                      <dd className="text-xl font-semibold tabular-nums text-ink sm:text-2xl">
                        {value}
                      </dd>
                      <dd className="text-[0.75rem] text-muted-foreground">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            }
          />
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <SplitRow
            tone="light"
            kicker={m.features_wb_player_kicker()}
            title={m.features_wb_player_title()}
            body={m.features_wb_player_body()}
            points={[
              m.features_wb_player_point_1(),
              m.features_wb_player_point_2(),
              m.features_wb_player_point_3(),
            ]}
            visual={
              <div className="relative pr-[18%] pb-10 sm:pr-[14%]">
                <Screenshot
                  src={shots.player}
                  alt={m.features_wb_player_shot()}
                  sizes="(min-width: 1024px) 600px, 85vw"
                />
                <PhoneShot
                  src={shots.mobilePlayerRest}
                  alt={m.features_wb_player_phone_shot()}
                  sizes="(min-width: 1024px) 200px, 30vw"
                  className="absolute right-0 bottom-0 w-[30%] max-w-[12rem]"
                />
              </div>
            }
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-sky-strong">
                {m.features_wb_targets_kicker()}
              </p>
              <h2 className="display-2-side mt-3">
                {m.features_wb_targets_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {m.features_wb_targets_body()}
              </p>
              <div className="mt-7 rounded-2xl border border-border bg-white p-5">
                <p className="font-mono text-[0.8rem] text-ink">
                  18 km/h × 80% = 14.4 km/h → 4:10 /km
                </p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {m.features_wb_targets_example()}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="grid gap-8 lg:col-span-7">
              <div>
                <p className="kicker text-muted-foreground">
                  {m.features_wb_targets_col_target()}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <li
                      key={i}
                      className={
                        i >= 6 && i <= 10
                          ? 'rounded-full border border-sky/50 bg-sky/10 px-3.5 py-1.5 text-[0.9rem] font-medium text-sky-strong'
                          : 'rounded-full border border-border bg-white px-3.5 py-1.5 text-[0.9rem]'
                      }
                    >
                      {msg(`features_wb_target_${i + 1}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="kicker text-muted-foreground">
                  {m.features_wb_targets_col_duration()}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-[0.92rem]"
                    >
                      <span className="font-mono text-[0.7rem] text-muted-foreground">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {msg(`features_wb_duration_${i + 1}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.features_wb_send_kicker()}
                title={m.features_wb_send_title()}
                lead={m.features_wb_send_body()}
              />
              <ArrowLink
                href={localePath(locale, '/features/watch-sync')}
                className="mt-7"
              >
                {m.features_nav_sync_title()}
              </ArrowLink>
            </div>
            <Reveal delay={0.1} className="lg:col-span-7">
              <DeviceMatrix
                rows={deviceRows}
                yes={m.features_wb_send_yes()}
                no={m.features_wb_send_no()}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            flip
            kicker={m.features_wb_library_kicker()}
            title={m.features_wb_library_title()}
            body={m.features_wb_library_body()}
            visual={
              <div className="relative pb-10">
                <Screenshot
                  src={shots.workoutLibrary}
                  alt={m.features_wb_library_title()}
                  chrome={false}
                  sizes="(min-width: 1024px) 680px, 100vw"
                />
                <div className="absolute -bottom-2 left-3 w-[min(88%,19rem)] rounded-2xl border border-border bg-white p-3 shadow-[0_24px_48px_-24px_rgb(5_12_52/0.4)] sm:-left-6">
                  {library.map((group) => (
                    <div key={group.folder} className="py-1">
                      <p className="flex items-center gap-2 px-2 py-1 text-[0.85rem] font-semibold">
                        <Folder
                          className="size-4"
                          style={{ color: group.color }}
                        />
                        {group.folder}
                      </p>
                      <ul>
                        {group.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 rounded-md py-1 pr-2 pl-8 text-[0.8rem] text-ink/80"
                          >
                            <FileText className="size-3.5 text-muted-foreground" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <SplitRow
            tone="light"
            kicker={m.features_wb_ai_kicker()}
            title={m.features_wb_ai_title()}
            body={m.features_wb_ai_body()}
            visual={
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 text-[0.95rem] text-white">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-orchid" />
                  {m.features_wb_ai_prompt()}
                </div>
                <div className="mt-5 flex h-24 items-end gap-[3px]">
                  {[
                    [15, 1],
                    [10, 4],
                    [2, 0],
                    [10, 4],
                    [2, 0],
                    [10, 4],
                    [10, 1],
                  ].map(([minutes, zone], index) => (
                    <div
                      key={index}
                      className="rounded-t-[4px]"
                      style={{
                        width: `${(minutes / 59) * 100}%`,
                        height: `${18 + zone * 18}%`,
                        background: [
                          '#9fd3fb',
                          '#6ec1fc',
                          '#12a594',
                          '#f2b13c',
                          '#f4743b',
                        ][zone],
                      }}
                    />
                  ))}
                </div>
                <p className="mt-3 font-mono text-[0.7rem] text-white/50">
                  0:59 · 3 × 10&apos; · 2&apos; · 15&apos; + 10&apos;
                </p>
              </div>
            }
          >
            <ArrowLink
              tone="light"
              href={localePath(locale, '/features/ai-coach')}
              className="mt-7"
            >
              {m.features_wb_ai_link()}
            </ArrowLink>
          </SplitRow>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            kicker={m.features_wb_sports_kicker()}
            title={m.features_wb_sports_title()}
          />
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sports.map(({ icon: Icon, title, body }) => (
              <RevealItem
                key={title}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <Icon className="size-6 text-ink" />
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="paper" className="py-16 sm:py-20">
        <Container size="narrow">
          <Reveal className="rounded-3xl border border-border bg-white p-6 sm:p-10">
            <p className="kicker flex items-center gap-2 text-coral-strong">
              <Wrench className="size-3.5" />
              {m.features_wb_trouble_kicker()}
            </p>
            <h2 className="display-3 mt-3">{m.features_wb_trouble_title()}</h2>
            <ol className="mt-6 grid gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper font-mono text-[0.75rem] font-medium">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-ink/85">
                    {msg(`features_wb_trouble_${i + 1}`)}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-[0.9rem]">
              <span className="text-muted-foreground">
                {m.features_wb_trouble_more()}:
              </span>
              {(['garmin', 'suunto', 'coros'] as const).map((slug) => (
                <ArrowLink
                  key={slug}
                  href={localePath(locale, `/connect/${slug}`)}
                >
                  {provider(slug).name}
                </ArrowLink>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_builder"
      />
      <RelatedFeatures locale={locale} current="builder" />
      <CtaBand
        locale={locale}
        placement="features_builder_final"
        title={m.features_wb_final_title()}
        body={m.features_wb_final_body()}
      />
    </>
  );
}
