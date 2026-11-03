import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowUpRight, Gauge, HeartPulse, Mountain } from 'lucide-react';
import Link from 'next/link';

import { TrailTargetsCalculator } from './trail-targets-calculator';

/** How % of VMA and % of max heart rate become the athlete's numbers. */
export function TrailTargetsSection() {
  const kinds = [
    { icon: Gauge, label: m.trailplan_t_vma({ range: '62–95' }) },
    { icon: HeartPulse, label: m.trailplan_t_hr({ range: '65–95' }) },
    { icon: Mountain, label: m.trailplan_t_rpe({ value: '1–10' }) },
  ];
  return (
    <Section tone="paper" className="!py-16 sm:!py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="display-3 text-ink">
              {m.trailplan_targets_title()}
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-[#2b3354]">
              {m.trailplan_targets_body()}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {kinds.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 font-mono text-[0.8rem] text-ink"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-sky/40 bg-sky/10 px-4 py-3 text-[0.92rem] text-ink">
              {m.trailplan_targets_profile()}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <TrailTargetsCalculator />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/** The trail tools that go with a plan. */
export function TrailToolLinks({ locale }: { locale: SupportedLocale }) {
  const tools = [
    ['/tools/trail-time-estimator', m.trailplan_tool_estimator()],
    ['/tools/grade-adjusted-pace', m.trailplan_tool_gap()],
    ['/tools/vma', m.tplan_paces_vma()],
    ['/tools/heart-rate-zones', m.trailplan_tool_hr()],
  ];
  return (
    <div>
      <h2 className="display-3 text-ink">{m.trailplan_tools_title()}</h2>
      <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-muted-foreground">
        {m.trailplan_tools_body()}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tools.map(([href, label]) => (
          <Link
            key={href}
            href={localePath(locale, href)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            {label}
            <ArrowUpRight className="size-3.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
