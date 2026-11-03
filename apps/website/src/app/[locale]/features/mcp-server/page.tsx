import { faqEntries, msg } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureFaq,
  FeatureHero,
  FeatureJsonLd,
  RelatedFeatures,
} from '@/components/features/kit';
import { McpChat, ToolList } from '@/components/features/mcp-visuals';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { DOCS_URL, MCP_URL } from '@/config';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { ShieldCheck } from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features/mcp-server';
const GUIDE_URL = `${DOCS_URL}/docs/guides/ai-agents`;

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_mcp_seo_title(),
    description: m.features_mcp_seo_description(),
  });
}

const EXAMPLES = [
  [
    'get_athlete_context',
    'get_training_load',
    'get_training_volume',
    'plan_sessions',
  ],
  ['create_period', 'get_calendar', 'move_sessions', 'update_session'],
  ['get_calendar', 'get_activity', 'get_training_load'],
  ['log_metrics', 'update_training_zone'],
];

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-xl break-all whitespace-pre-wrap bg-[#030824] px-4 py-3 font-mono text-[0.75rem] leading-6 text-white/85">
      <code>{children}</code>
    </pre>
  );
}

export default async function McpServerPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('features_mcp_faq', 6);

  const setups = [
    {
      title: m.features_mcp_setup_claude_title(),
      sub: m.features_mcp_setup_claude_sub(),
      guide: '/ai/claude',
      steps: [
        m.features_mcp_setup_claude_1(),
        m.features_mcp_setup_claude_2(),
        m.features_mcp_setup_claude_3(),
      ],
    },
    {
      title: m.features_mcp_setup_chatgpt_title(),
      sub: m.features_mcp_setup_chatgpt_sub(),
      guide: '/ai/chatgpt',
      steps: [
        m.features_mcp_setup_chatgpt_1(),
        m.features_mcp_setup_chatgpt_2(),
        m.features_mcp_setup_chatgpt_3(),
      ],
    },
    {
      title: m.features_mcp_setup_code_title(),
      sub: m.features_mcp_setup_code_sub(),
      code: `claude mcp add --transport http openathlete ${MCP_URL}`,
    },
    {
      title: m.features_mcp_setup_other_title(),
      sub: m.features_mcp_setup_other_sub(),
      code: `{
  "mcpServers": {
    "openathlete": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer oa_pat_..." }
    }
  }
}`,
    },
  ];

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_nav_mcp_title()}
        path={PATH}
        faqs={faqs}
      />
      <FeatureHero
        locale={locale}
        placement="features_mcp_hero"
        crumb={m.features_nav_mcp_title()}
        kicker={m.features_mcp_kicker()}
        title={m.features_mcp_title()}
        lead={m.features_mcp_lead()}
        proofs={[
          m.features_mcp_proof_1(),
          m.features_mcp_proof_2(),
          m.features_mcp_proof_3(),
        ]}
        secondary={{ href: '#setup', label: m.features_mcp_secondary() }}
        visual={
          <McpChat
            client="Claude · OpenAthlete"
            prompt={m.features_mcp_chat_prompt()}
            calls={[
              { tool: 'get_athlete_context', detail: m.features_mcp_chat_c1() },
              { tool: 'get_training_volume', detail: m.features_mcp_chat_c2() },
              { tool: 'plan_sessions', detail: m.features_mcp_chat_c3() },
            ]}
            reply={m.features_mcp_chat_reply()}
          />
        }
      />

      <Section tone="paper" className="py-16 sm:py-20">
        <Container size="narrow">
          <Reveal>
            <p className="kicker text-sky-strong">
              {m.features_mcp_what_kicker()}
            </p>
            <h2 className="display-3 mt-3">{m.features_mcp_what_title()}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              {m.features_mcp_what_body()}
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            kicker={m.features_mcp_ask_kicker()}
            title={m.features_mcp_ask_title()}
            lead={m.features_mcp_ask_lead()}
          />
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2">
            {EXAMPLES.map((tools, index) => (
              <RevealItem
                key={index}
                className="flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-7"
              >
                <p className="text-lg leading-snug font-medium">
                  “{msg(`features_mcp_ask_${index + 1}`)}”
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-6">
                  {tools.map((tool, i) => (
                    <span key={tool} className="flex items-center gap-1.5">
                      <code className="rounded-md bg-paper px-2 py-1 font-mono text-[0.72rem] text-sky-strong">
                        {tool}
                      </code>
                      {i < tools.length - 1 && (
                        <span className="text-[0.7rem] text-muted-foreground">
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.features_mcp_tools_kicker()}
            title={m.features_mcp_tools_title()}
            lead={m.features_mcp_tools_lead()}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <ToolList
                tone="read"
                title={m.features_mcp_read_title()}
                badge="read · 12"
                rows={[
                  {
                    tools: ['get_athlete_context'],
                    body: m.features_mcp_t_context(),
                  },
                  {
                    tools: ['get_calendar'],
                    body: m.features_mcp_t_calendar(),
                  },
                  {
                    tools: ['get_session', 'get_activity'],
                    body: m.features_mcp_t_session(),
                  },
                  {
                    tools: ['get_activities', 'get_training_volume'],
                    body: m.features_mcp_t_history(),
                  },
                  {
                    tools: ['get_training_load'],
                    body: m.features_mcp_t_load(),
                  },
                  {
                    tools: ['get_metrics', 'get_capacities', 'get_records'],
                    body: m.features_mcp_t_metrics(),
                  },
                  {
                    tools: ['list_workout_templates', 'list_athletes'],
                    body: m.features_mcp_t_library(),
                  },
                ]}
              />
            </Reveal>
            <Reveal delay={0.1}>
              <ToolList
                tone="write"
                title={m.features_mcp_write_title()}
                badge="write · 11"
                rows={[
                  { tools: ['plan_sessions'], body: m.features_mcp_t_plan() },
                  {
                    tools: ['update_session'],
                    body: m.features_mcp_t_update(),
                  },
                  {
                    tools: ['move_sessions', 'copy_sessions', 'repeat_session'],
                    body: m.features_mcp_t_move(),
                  },
                  {
                    tools: ['delete_sessions'],
                    body: m.features_mcp_t_delete(),
                  },
                  {
                    tools: ['create_period', 'update_period', 'delete_period'],
                    body: m.features_mcp_t_period(),
                  },
                  {
                    tools: ['log_metrics', 'update_training_zone'],
                    body: m.features_mcp_t_log(),
                  },
                ]}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section id="setup">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              kicker={m.features_mcp_setup_kicker()}
              title={m.features_mcp_setup_title()}
              lead={m.features_mcp_setup_lead()}
            />
            <ArrowLink href={GUIDE_URL}>{m.features_mcp_secondary()}</ArrowLink>
          </div>
          <Reveal className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <span className="kicker text-muted-foreground">URL</span>
            <code className="font-mono text-[0.95rem] break-all text-ink sm:text-base">
              {MCP_URL}
            </code>
          </Reveal>
          <RevealGroup className="mt-5 grid gap-4 md:grid-cols-2">
            {setups.map((setup) => (
              <RevealItem
                key={setup.title}
                className="flex flex-col rounded-3xl border border-border bg-white p-6"
              >
                <h3 className="text-lg font-semibold">{setup.title}</h3>
                <p className="mt-1 text-[0.88rem] text-muted-foreground">
                  {setup.sub}
                </p>
                <div className="mt-5">
                  {setup.steps ? (
                    <ol className="grid gap-2.5">
                      {setup.steps.map((step, index) => (
                        <li key={step} className="flex gap-3 text-[0.92rem]">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-paper font-mono text-[0.72rem]">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Code>{setup.code!}</Code>
                  )}
                </div>
                {setup.guide && (
                  <ArrowLink
                    href={localePath(locale, setup.guide)}
                    className="mt-5"
                  >
                    {m.features_mcp_setup_guide()}
                  </ArrowLink>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">
                {m.features_mcp_coach_kicker()}
              </p>
              <h2 className="display-2-side mt-3 text-white">
                {m.features_mcp_coach_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-white/70">
                {m.features_mcp_coach_body()}
              </p>
              <ArrowLink
                tone="light"
                href={localePath(locale, '/coaches')}
                className="mt-7"
              >
                {m.features_mcp_coach_link()}
              </ArrowLink>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <McpChat
                client="ChatGPT · OpenAthlete"
                prompt={m.features_mcp_coach_prompt()}
                calls={[
                  { tool: 'list_athletes', detail: m.features_mcp_coach_c1() },
                  { tool: 'get_calendar', detail: m.features_mcp_coach_c2() },
                ]}
                reply={m.features_mcp_coach_reply()}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading
                size="side"
                kicker={m.features_mcp_sec_kicker()}
                title={m.features_mcp_sec_title()}
              />
              <p className="mt-6 text-[0.95rem] leading-relaxed text-muted-foreground">
                {m.features_mcp_sec_note()}
              </p>
            </div>
            <RevealGroup className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border lg:col-span-8">
              {[1, 2, 3, 4, 5].map((n) => (
                <RevealItem key={n} className="flex gap-4 bg-white p-5 sm:p-6">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-strong" />
                  <p className="leading-relaxed text-ink/85">
                    {msg(`features_mcp_sec_${n}`)}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      <FeatureFaq
        title={m.features_faq_title()}
        items={faqs}
        placement="features_mcp"
      />
      <RelatedFeatures locale={locale} current="mcp" />
      <CtaBand
        locale={locale}
        placement="features_mcp_final"
        title={m.features_mcp_final_title()}
        body={m.features_mcp_final_body()}
      />
    </>
  );
}
