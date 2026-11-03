import { shots } from '@/assets/screenshots';
import {
  ModelPanel,
  QuestionsCard,
  SessionRead,
} from '@/components/features/ai-visuals';
import { faqEntries, msg } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  LimitsCard,
  RelatedFeatures,
  SplitRow,
} from '@/components/features/kit';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { AiExchange } from '@/components/site/visuals/ai-exchange';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { initLocale } from '@/i18n/server';
import { supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  Calculator,
  KeyRound,
  MessageCircleQuestion,
  PenLine,
  ScanText,
  ShieldCheck,
  Wand2,
} from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/ai-coach';

const PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Mistral',
  'OpenRouter',
  'DeepSeek',
  'xAI',
  'Groq',
  'OVHcloud',
  'Scaleway',
  'Together AI',
  'Fireworks',
];

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_ai_seo_title(),
    description: m.features_ai_seo_description(),
  });
}

const JOB_ICONS = [Wand2, PenLine, MessageCircleQuestion, ScanText, Calculator];

export default async function AiCoachPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_ai_faq', 6);

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_ai_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_ai_hero"
        crumb={m.features_nav_ai_title()}
        kicker={m.features_ai_kicker()}
        title={m.features_ai_title()}
        lead={m.features_ai_lead()}
        proofs={[
          m.features_ai_proof_1(),
          m.features_ai_proof_2(),
          m.features_ai_proof_3(),
        ]}
        secondary={{
          href: localePath(locale, '/pricing'),
          label: m.features_ai_secondary(),
        }}
        visual={
          <div className="relative">
            <SessionRead
              className="sm:mr-12"
              label={m.features_ai_read_label()}
              headline={m.features_ai_read_headline()}
              findings={[
                m.features_ai_read_f1(),
                m.features_ai_read_f2(),
                m.features_ai_read_f3(),
              ]}
              suggestion={m.features_ai_read_tip()}
            />
            <QuestionsCard
              className="relative z-10 mt-3 ml-auto sm:-mt-8 w-[min(94%,24rem)] sm:-mr-4"
              question={m.features_ai_q()}
              choices={[
                m.features_ai_q_c1(),
                m.features_ai_q_c2(),
                m.features_ai_q_c3(),
              ]}
              selected={2}
              voice={m.features_ai_q_voice()}
              noted={m.features_ai_q_noted()}
            />
          </div>
        }
      />

      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.features_ai_jobs_kicker()}
            title={m.features_ai_jobs_title()}
            lead={m.features_ai_jobs_lead()}
          />
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-6">
            {JOB_ICONS.map((Icon, index) => (
              <RevealItem
                key={index}
                className={cn(
                  'flex flex-col rounded-3xl border p-6 sm:p-7',
                  index < 2 ? 'md:col-span-3' : 'md:col-span-2',
                  index === 2
                    ? 'ink-band border-transparent'
                    : 'border-border bg-white',
                )}
              >
                <span
                  className={cn(
                    'grid size-10 place-items-center rounded-xl [&_svg]:size-[18px]',
                    index === 2
                      ? 'bg-white/10 text-white'
                      : 'bg-paper text-ink',
                  )}
                >
                  <Icon />
                </span>
                <h3
                  className={cn(
                    'mt-5 text-lg font-semibold',
                    index === 2 && 'text-white',
                  )}
                >
                  {msg(`features_ai_job_${index + 1}_title`)}
                </h3>
                <p
                  className={cn(
                    'mt-2 text-[0.95rem] leading-relaxed',
                    index === 2 ? 'text-white/70' : 'text-muted-foreground',
                  )}
                >
                  {msg(`features_ai_job_${index + 1}_body`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-10">
            <Screenshot
              src={shots.aiGenerate}
              alt={m.features_ai_job_1_title()}
              sizes="(min-width: 1280px) 1100px, 100vw"
            />
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            kicker={m.features_ai_byok_kicker()}
            title={m.features_ai_byok_title()}
            body={
              <>
                <p>{m.features_ai_byok_body()}</p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {PROVIDERS.map((provider) => (
                    <li
                      key={provider}
                      className="rounded-full border border-border bg-white px-3 py-1 font-mono text-[0.75rem] text-ink/75"
                    >
                      {provider}
                    </li>
                  ))}
                  <li className="px-1 py-1 font-mono text-[0.75rem] text-muted-foreground">
                    {m.features_ai_byok_more()}
                  </li>
                </ul>
                <p className="text-[0.92rem]">{m.features_ai_byok_local()}</p>
              </>
            }
            visual={
              <ModelPanel
                title={m.features_ai_panel_title()}
                keyLabel={m.features_ai_panel_key()}
                usageLabel={m.features_ai_panel_usage()}
                usageOwn={m.features_ai_panel_own()}
                usageIncluded={m.features_ai_panel_included()}
                rows={[
                  { feature: m.features_ai_panel_default(), model: 'Mistral' },
                  { feature: m.features_ai_job_1_title(), model: 'Anthropic' },
                  { feature: m.features_ai_job_2_title(), model: 'Anthropic' },
                  {
                    feature: m.features_ai_job_3_title(),
                    model: m.features_ai_panel_inherit(),
                    inherited: true,
                  },
                  { feature: m.features_ai_job_4_title(), model: 'OpenAI' },
                  {
                    feature: m.features_ai_job_5_title(),
                    model: m.features_ai_panel_inherit(),
                    inherited: true,
                  },
                ]}
              />
            }
          />
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <SectionHeading
            tone="light"
            kicker={m.features_ai_pay_kicker()}
            title={
              <span className="text-white">{m.features_ai_pay_title()}</span>
            }
            lead={m.features_ai_pay_body()}
          />
          <RevealGroup className="mt-12 grid gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((step) => (
              <RevealItem
                key={step}
                className={cn(
                  'relative rounded-2xl border p-6',
                  step === 4
                    ? 'border-dashed border-white/20'
                    : 'border-white/10 bg-white/[0.04]',
                )}
              >
                <span className="font-mono text-[0.72rem] text-ink-soft">
                  {String(step).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {msg(`features_ai_pay_${step}_title`)}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-white/65">
                  {msg(`features_ai_pay_${step}_body`)}
                </p>
                {step === 2 && (
                  <TrackedLink
                    href={supporterUrl('features_ai_pay')}
                    event="supporter_clicked"
                    properties={{
                      placement: 'features_ai_pay',
                      cta: 'supporter',
                    }}
                    className="mt-4 inline-flex text-[0.9rem] font-medium text-mint hover:text-white"
                  >
                    {m.features_ai_secondary()} →
                  </TrackedLink>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
          <p className="mt-8 max-w-3xl text-[0.92rem] leading-relaxed text-white/55">
            {m.features_ai_pay_selfhost()}
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            flip
            kicker={m.features_ai_coach_kicker()}
            title={m.features_ai_coach_title()}
            body={m.features_ai_coach_body()}
            points={[
              m.features_ai_coach_point_1(),
              m.features_ai_coach_point_2(),
            ]}
            visual={
              <Screenshot
                src={shots.coachDashboard}
                alt={m.features_ai_coach_title()}
                chrome={false}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            }
          >
            <ArrowLink href={localePath(locale, '/coaches')} className="mt-7">
              {m.features_ai_coach_link()}
            </ArrowLink>
          </SplitRow>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SplitRow
            kicker={m.features_ai_mcp_kicker()}
            title={m.features_ai_mcp_title()}
            body={m.features_ai_mcp_body()}
            visual={
              <div className="ink-band relative overflow-hidden rounded-3xl p-6 sm:p-8">
                <div className="dot-grid absolute inset-0 opacity-50" />
                <div className="relative">
                  <AiExchange
                    prompt={m.features_ai_mcp_prompt()}
                    reply={m.features_ai_mcp_reply()}
                    via={m.features_ai_mcp_via()}
                  />
                </div>
              </div>
            }
          >
            <ArrowLink
              href={localePath(locale, '/features/mcp-server')}
              className="mt-7"
            >
              {m.features_ai_mcp_link()}
            </ArrowLink>
          </SplitRow>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHeading
                kicker={m.features_ai_privacy_kicker()}
                title={m.features_ai_privacy_title()}
              />
              <RevealGroup className="mt-10 grid gap-6">
                {[
                  { icon: ShieldCheck, n: 1 },
                  { icon: ScanText, n: 2 },
                  { icon: KeyRound, n: 3 },
                ].map(({ icon: Icon, n }) => (
                  <RevealItem key={n} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-paper">
                      <Icon className="size-[18px]" />
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        {msg(`features_ai_privacy_${n}_title`)}
                      </h3>
                      <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">
                        {msg(`features_ai_privacy_${n}_body`)}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
            <Reveal delay={0.1} className="lg:col-span-5 lg:pt-16">
              <LimitsCard
                title={m.features_ai_limits_title()}
                items={[1, 2, 3, 4, 5].map((n) =>
                  msg(`features_ai_limit_${n}`),
                )}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_ai"
      />
      <RelatedFeatures locale={locale} current="ai" />
      <CtaBand
        locale={locale}
        placement="features_ai_final"
        title={m.features_ai_final_title()}
        body={m.features_ai_final_body()}
      />
    </>
  );
}
