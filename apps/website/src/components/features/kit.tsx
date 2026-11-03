import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { Faq, type FaqEntry } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { FEATURE_PAGES, type FeatureId, featureTitle, msg } from './helpers';

/** BreadcrumbList JSON-LD for a feature page, and FAQPage if given. */
export function FeatureJsonLd({
  locale,
  name,
  path,
  faqs,
}: {
  locale: SupportedLocale;
  name: string;
  path: string;
  faqs?: FaqEntry[];
}) {
  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.features_crumb_home(), url: localizedUrl(locale, '') },
          {
            name: m.features_crumb_features(),
            url: localizedUrl(locale, '/features'),
          },
          ...(path === '/features'
            ? []
            : [{ name, url: localizedUrl(locale, path) }]),
        ]}
      />
      {faqs && <FAQPageStructuredData faqs={faqs} />}
    </>
  );
}

/** Top of a feature page: breadcrumb, headline, two calls to action, a visual. */
export function FeatureHero({
  locale,
  placement,
  crumb,
  kicker,
  title,
  lead,
  proofs,
  secondary,
  visual,
  stacked,
}: {
  locale: SupportedLocale;
  placement: string;
  crumb?: string;
  kicker: string;
  title: ReactNode;
  lead: ReactNode;
  proofs?: string[];
  secondary?: { href: string; label: string };
  visual?: ReactNode;
  /** Visual under the text, full width, instead of next to it. */
  stacked?: boolean;
}) {
  const intro = (
    <>
      <p className="lead max-w-xl">{lead}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <TrackedLink
          href={signupUrl(placement)}
          event="cta_clicked"
          properties={{ placement, cta: 'signup' }}
          className={buttonStyles({
            size: 'lg',
            className: 'w-full sm:w-auto',
          })}
        >
          {m.site_cta_start()}
          <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
        </TrackedLink>
        {secondary && (
          <Link
            href={secondary.href}
            className={buttonStyles({
              variant: 'secondary',
              size: 'lg',
              className: 'w-full sm:w-auto',
            })}
          >
            {secondary.label}
          </Link>
        )}
      </div>
      {proofs && (
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] text-muted-foreground">
          {proofs.map((proof) => (
            <li key={proof} className="flex items-center gap-1.5">
              <Check className="size-4 text-mint-strong" />
              {proof}
            </li>
          ))}
        </ul>
      )}
    </>
  );
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
        <div className="absolute top-[-14rem] left-[10%] h-[30rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_28%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[4rem] right-[-6rem] h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_18%,transparent),transparent)] blur-2xl" />
      </div>
      <Container className="relative">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-[0.82rem] text-muted-foreground">
            <li>
              <Link href={localePath(locale, '')} className="hover:text-ink">
                {m.features_crumb_home()}
              </Link>
            </li>
            <ChevronRight className="size-3.5 opacity-50" aria-hidden />
            <li>
              {crumb ? (
                <Link
                  href={localePath(locale, '/features')}
                  className="hover:text-ink"
                >
                  {m.features_crumb_features()}
                </Link>
              ) : (
                <span className="text-ink">{m.features_crumb_features()}</span>
              )}
            </li>
            {crumb && (
              <>
                <ChevronRight className="size-3.5 opacity-50" aria-hidden />
                <li className="text-ink" aria-current="page">
                  {crumb}
                </li>
              </>
            )}
          </ol>
        </nav>
        {stacked ? (
          <>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-14">
              <div className="lg:col-span-7">
                <p className="kicker text-sky-strong">{kicker}</p>
                {/* No entrance animation on the headline: it is the largest paint */}
                <h1 className="display-1 mt-4">{title}</h1>
              </div>
              <div className="lg:col-span-5">{intro}</div>
            </div>
            {visual && (
              <Reveal delay={0.1} className="mt-12 sm:mt-16">
                {visual}
              </Reveal>
            )}
          </>
        ) : (
          <div
            className={cn(
              'grid gap-12',
              visual && 'items-center lg:grid-cols-12 lg:gap-14',
            )}
          >
            <div className={cn(visual && 'lg:col-span-6')}>
              <p className="kicker text-sky-strong">{kicker}</p>
              {/* No entrance animation on the headline: it is the largest paint */}
              <h1 className="display-1 mt-4">{title}</h1>
              <div className="mt-6">{intro}</div>
            </div>
            {visual && (
              <Reveal delay={0.1} className="min-w-0 lg:col-span-6">
                {visual}
              </Reveal>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Copy on one side, a visual on the other. */
export function SplitRow({
  kicker,
  title,
  body,
  points,
  visual,
  flip,
  tone = 'dark',
  children,
  as: Heading = 'h2',
}: {
  kicker?: string;
  title: string;
  body: ReactNode;
  points?: string[];
  visual: ReactNode;
  flip?: boolean;
  tone?: 'dark' | 'light';
  children?: ReactNode;
  as?: 'h2' | 'h3';
}) {
  const light = tone === 'light';
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal
        className={cn('lg:col-span-5', flip && 'lg:order-2 lg:col-start-8')}
      >
        {kicker && (
          <p
            className={cn(
              'kicker',
              light ? 'text-ink-soft' : 'text-sky-strong',
            )}
          >
            {kicker}
          </p>
        )}
        <Heading
          className={cn(
            Heading === 'h2' ? 'display-2-side' : 'display-3',
            'mt-3',
            light && 'text-white',
          )}
        >
          {title}
        </Heading>
        <div
          className={cn(
            'mt-5 space-y-4 leading-relaxed',
            light ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {typeof body === 'string' ? <p>{body}</p> : body}
        </div>
        {points && (
          <ul className="mt-6 grid gap-2.5">
            {points.map((point) => (
              <li
                key={point}
                className={cn(
                  'flex gap-2.5 text-[0.95rem]',
                  light && 'text-white/85',
                )}
              >
                <Check
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    light ? 'text-mint' : 'text-mint-strong',
                  )}
                />
                {point}
              </li>
            ))}
          </ul>
        )}
        {children}
      </Reveal>
      <Reveal
        delay={0.1}
        className={cn(
          'min-w-0 lg:col-span-7',
          flip && 'lg:order-1 lg:col-start-1',
        )}
      >
        {visual}
      </Reveal>
    </div>
  );
}

/** A small inline link with an arrow. */
export function ArrowLink({
  href,
  children,
  tone = 'dark',
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const external = /^https?:\/\//.test(href);
  const classes = cn(
    'group inline-flex items-center gap-1.5 font-medium',
    tone === 'dark'
      ? 'text-ink hover:text-sky-strong'
      : 'text-white hover:text-mint',
    className,
  );
  const content = (
    <>
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/** Cards to the other feature pages, at the bottom of each one. */
export function RelatedFeatures({
  locale,
  current,
  title,
}: {
  locale: SupportedLocale;
  current?: FeatureId;
  title?: string;
}) {
  const pages = FEATURE_PAGES.filter((page) => page.id !== current);
  return (
    <Section tone="paper" className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-3">{title ?? m.features_related_title()}</h2>
          <ArrowLink href={localePath(locale, '/features')}>
            {m.features_related_all()}
          </ArrowLink>
        </div>
        <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pages.map(({ slug, id, icon: Icon }) => (
            <RevealItem key={slug}>
              <Link
                href={localePath(locale, `/features/${slug}`)}
                className="group flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(5_12_52/0.35)]"
              >
                <Icon className="size-5 text-sky-strong" />
                <p className="mt-4 font-semibold">{featureTitle(id)}</p>
                <p className="mt-1 text-[0.88rem] leading-snug text-muted-foreground">
                  {msg(`features_nav_${id}_desc`)}
                </p>
                <span className="mt-auto pt-4">
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

export function FeatureFaq({
  title,
  items,
  placement,
}: {
  title: string;
  items: FaqEntry[];
  placement: string;
}) {
  return (
    <Section>
      <Container size="narrow">
        <h2 className="display-2 mb-10">{title}</h2>
        <Faq items={items} placement={placement} />
      </Container>
    </Section>
  );
}

/** A labelled honest-limits block: what the feature does not do. */
export function LimitsCard({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-dashed border-ink/20 bg-white p-6 sm:p-8',
        className,
      )}
    >
      <p className="kicker text-coral-strong">{title}</p>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed">
            <span className="mt-[0.6rem] h-px w-3 shrink-0 bg-coral-strong" />
            <span className="text-ink/80">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
