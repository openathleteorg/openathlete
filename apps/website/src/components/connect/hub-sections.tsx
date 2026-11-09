import { buttonStyles } from '@/components/site/button';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { DOCS_URL, SELF_HOSTING_DOCS_URL } from '@/config';
import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  type SupportedLocale,
  localePath,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  FileUp,
  KeyRound,
  X,
} from 'lucide-react';
import Link from 'next/link';

import {
  CAPABILITIES,
  CONNECTORS,
  type Connector,
  type HistoryReach,
  capabilityLabel,
  providerMessage,
} from './data';
import { Breadcrumbs, ConnectorLogo, SupportPill } from './parts';

export const ACTIVITY_IMPORT_DOCS_URL = `${DOCS_URL}/docs/guides/activity-import-api`;

function historyLabel(reach: HistoryReach): string {
  return {
    full: m.connect_hub_history_full(),
    '30': m.connect_hub_history_30(),
    slow: m.connect_hub_history_slow(),
    none: m.connect_hub_history_none(),
  }[reach];
}

export function HubHero({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="relative -mt-[var(--header-height)] overflow-hidden pt-[calc(var(--header-height)+2.5rem)] pb-20 sm:pt-[calc(var(--header-height)+4rem)] sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute top-[-12rem] left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_30%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[20rem] right-[4%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--coral)_16%,transparent),transparent)] blur-2xl" />
      </div>
      <Container className="relative">
        <Breadcrumbs
          items={[
            { name: m.connect_crumb_home(), href: localePath(locale, '/') },
            { name: m.site_nav_integrations() },
          ]}
        />
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="kicker text-sky-strong">{m.connect_hub_kicker()}</p>
          {/* No entrance animation: the headline is the largest paint */}
          <h1 className="display-1 mt-4">{m.connect_hub_h1()}</h1>
          <p className="lead mx-auto mt-6 max-w-2xl">{m.connect_hub_lead()}</p>
        </div>
        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CONNECTORS.map((connector) => (
            <RevealItem key={connector.slug}>
              <ConnectorCard connector={connector} locale={locale} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}

function ConnectorCard({
  connector,
  locale,
}: {
  connector: Connector;
  locale: SupportedLocale;
}) {
  const out = connector.support.workouts === 'yes';
  return (
    <Link
      href={localePath(locale, `/connect/${connector.slug}`)}
      className="group relative flex h-full flex-col rounded-2xl border border-border bg-white/90 p-5 backdrop-blur transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_rgb(5_12_52/0.4)]"
    >
      {connector.isNew && (
        <span className="absolute top-4 right-4 rounded-full bg-coral/15 px-2 py-0.5 text-[0.7rem] font-medium text-coral-strong">
          {m.connect_new_badge()}
        </span>
      )}
      <div className="flex h-10 items-center">
        <ConnectorLogo connector={connector} height={22} />
      </div>
      <p className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-muted-foreground">
        {providerMessage(connector.slug, 'tagline')}
      </p>
      <ul className="mt-5 grid gap-1.5 text-[0.8rem]">
        <li className="flex items-center gap-1.5">
          <Check className="size-3.5 text-mint-strong" strokeWidth={2.5} />
          {m.connect_flow_in()}
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5',
            !out && 'text-muted-foreground',
          )}
        >
          {out ? (
            <Check className="size-3.5 text-mint-strong" strokeWidth={2.5} />
          ) : (
            <X className="size-3.5" strokeWidth={2.5} />
          )}
          {out ? m.connect_flow_out() : m.connect_flow_no_out()}
        </li>
      </ul>
      <span className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-[0.85rem] font-medium">
        {m.connect_hub_details()}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function HubMatrix({ locale }: { locale: SupportedLocale }) {
  return (
    <Section tone="paper">
      <Container>
        <SectionHeading
          kicker={m.connect_hub_matrix_kicker()}
          title={m.connect_hub_matrix_title()}
          lead={m.connect_hub_matrix_lead()}
        />
        <Reveal className="mt-12 overflow-hidden rounded-3xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="kicker px-6 py-4 font-medium text-muted-foreground"
                  >
                    {m.connect_hub_col_service()}
                  </th>
                  {CAPABILITIES.map((capability) => (
                    <th
                      key={capability}
                      scope="col"
                      className="kicker px-4 py-4 font-medium text-muted-foreground"
                    >
                      {capabilityLabel(capability)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CONNECTORS.map((connector) => (
                  <tr
                    key={connector.slug}
                    className="transition-colors hover:bg-paper/60"
                  >
                    <th scope="row" className="px-6 py-5 font-normal">
                      <Link
                        href={localePath(locale, `/connect/${connector.slug}`)}
                        className="inline-flex items-center"
                      >
                        <ConnectorLogo connector={connector} height={18} />
                      </Link>
                    </th>
                    {CAPABILITIES.map((capability) => (
                      <td key={capability} className="px-4 py-5">
                        <SupportPill
                          support={connector.support[capability]}
                          label={
                            capability === 'history'
                              ? historyLabel(connector.history)
                              : undefined
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function HubOtherWays({ locale }: { locale: SupportedLocale }) {
  return (
    <Section>
      <Container>
        <SectionHeading
          kicker={m.connect_hub_other_kicker()}
          title={m.connect_hub_other_title()}
          lead={m.connect_hub_other_lead()}
        />
        <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-3">
          <RevealItem className="flex flex-col rounded-3xl border border-border bg-white p-7 lg:row-span-2">
            <CardTitle icon={<FileUp />} title={m.connect_hub_files_title()} />
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {m.connect_hub_files_body()}
            </p>
            <FileDropVisual />
            <p className="mt-5 text-[0.85rem] text-muted-foreground">
              {m.connect_hub_files_note()}
            </p>
          </RevealItem>
          <RevealItem className="flex flex-col rounded-3xl border border-border bg-white p-7 lg:col-span-2">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <CardTitle
                  icon={<KeyRound />}
                  title={m.connect_hub_api_title()}
                />
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {m.connect_hub_api_body()}
                </p>
                <TrackedLink
                  href={ACTIVITY_IMPORT_DOCS_URL}
                  event="cta_clicked"
                  properties={{ placement: 'connect_hub_api', cta: 'docs' }}
                  className="mt-5 inline-flex items-center gap-1.5 font-medium hover:text-sky-strong"
                >
                  {m.connect_hub_api_link()}
                  <ArrowUpRight className="size-4" />
                </TrackedLink>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-[#030824] p-5 font-mono text-[0.78rem] leading-6 text-white/80">
                <code>
                  <span className="text-white/40"># scope: </span>
                  <span className="text-mint">activities:import</span>
                  {'\n'}
                  <span className="text-sky">POST</span> /activity-import/fit
                  {'\n'}
                  <span className="text-sky">POST</span> /activity-import/gpx
                  {'\n'}
                  <span className="text-sky">POST</span> /activity-import/tcx
                  {'\n\n'}
                  <span className="text-white/40">Authorization: Bearer …</span>
                </code>
              </pre>
            </div>
          </RevealItem>
          <RevealItem className="flex flex-col rounded-3xl border border-border bg-white p-7 lg:col-span-2">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <CardTitle
                  icon={<CalendarDays />}
                  title={m.connect_hub_ical_title()}
                />
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {m.connect_hub_ical_body()}
                </p>
              </div>
              <CalendarVisual locale={locale} />
            </div>
          </RevealItem>
        </RevealGroup>
      </Container>
    </Section>
  );
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-3 text-xl font-semibold tracking-[-0.02em]">
      <span className="grid size-10 place-items-center rounded-xl border border-border bg-paper [&_svg]:size-[18px]">
        {icon}
      </span>
      {title}
    </h3>
  );
}

/** Three files dropped on the calendar: one in, one in, one already there. */
function FileDropVisual() {
  const files = [
    { name: 'morning-run.fit', size: '412 KB', ok: true },
    { name: 'col-de-porte.gpx', size: '1.8 MB', ok: true },
    { name: 'morning-run (1).fit', size: '412 KB', ok: false },
  ];
  return (
    <div className="mt-6 flex-1 rounded-2xl border-2 border-dashed border-border bg-paper/60 p-4">
      <ul className="grid gap-2">
        {files.map((file) => (
          <li
            key={file.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky/15 font-mono text-[0.6rem] font-semibold text-sky-strong uppercase">
              {file.name.split('.').pop()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[0.78rem]">
                {file.name}
              </span>
              <span className="block text-[0.72rem] text-muted-foreground">
                {file.size}
              </span>
            </span>
            {file.ok ? (
              <Check
                className="size-4 shrink-0 text-mint-strong"
                strokeWidth={2.5}
              />
            ) : (
              <X
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={2.5}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A planned session as it shows in a phone calendar. */
function CalendarVisual({ locale }: { locale: SupportedLocale }) {
  // 10 November 2025 was a Monday
  const days = [10, 11, 12, 13, 14, 15, 16].map((date) => ({
    date,
    letter: new Date(Date.UTC(2025, 10, date)).toLocaleDateString(
      DATE_LOCALES[locale],
      { weekday: 'narrow', timeZone: 'UTC' },
    ),
  }));
  return (
    <div className="rounded-2xl border border-border bg-paper/60 p-4">
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[0.65rem] text-muted-foreground">
        {days.map((day) => (
          <span key={day.date}>{day.letter}</span>
        ))}
        {days.map(({ date }) => (
          <span
            key={date}
            className={cn(
              'rounded-md py-1 text-[0.75rem]',
              date === 11 ? 'bg-ink text-white' : 'text-ink',
            )}
          >
            {date}
          </span>
        ))}
      </div>
      <div className="mt-3 grid gap-1.5">
        <div className="rounded-lg border-l-[3px] border-sky bg-white px-3 py-2 text-[0.8rem]">
          <span className="font-medium">{m.connect_hub_ical_sample()}</span>
          <span className="block font-mono text-[0.68rem] text-muted-foreground">
            1h05 · 13 km
          </span>
        </div>
        <div className="rounded-lg border-l-[3px] border-coral bg-white px-3 py-2 text-[0.8rem]">
          <span className="font-medium">10 km · A</span>
          <span className="block font-mono text-[0.68rem] text-muted-foreground">
            {new Date(Date.UTC(2025, 10, 16)).toLocaleDateString(
              DATE_LOCALES[locale],
              { weekday: 'short', day: 'numeric', timeZone: 'UTC' },
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HubSelfHost() {
  return (
    <Section tone="ink">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="kicker text-ink-soft">
              {m.connect_hub_selfhost_kicker()}
            </p>
            <h2 className="display-2-side mt-4 text-white">
              {m.connect_hub_selfhost_title()}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {m.connect_hub_selfhost_body()}
            </p>
            <TrackedLink
              href={SELF_HOSTING_DOCS_URL}
              event="self_host_clicked"
              properties={{ placement: 'connect_hub_selfhost' }}
              className={buttonStyles({
                variant: 'outlineLight',
                className: 'mt-8',
              })}
            >
              {m.connect_hub_selfhost_link()}
              <ArrowUpRight />
            </TrackedLink>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-3">
            {[...CONNECTORS]
              .sort(
                (a, b) =>
                  Number(Boolean(b.selfHostReady)) -
                  Number(Boolean(a.selfHostReady)),
              )
              .map((connector) => (
                <div
                  key={connector.slug}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-2xl border px-5 py-4',
                    connector.selfHostReady
                      ? 'border-mint/40 bg-mint/[0.07]'
                      : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <span className="font-medium text-white">
                    {connector.name}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-[0.85rem]',
                      connector.selfHostReady ? 'text-mint' : 'text-white/50',
                    )}
                  >
                    {connector.selfHostReady ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {connector.selfHostReady
                      ? m.connect_hub_selfhost_ready()
                      : m.connect_hub_selfhost_needs()}
                  </span>
                </div>
              ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
