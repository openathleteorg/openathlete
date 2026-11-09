import { shots } from '@/assets/screenshots';
import { buttonStyles } from '@/components/site/button';
import { Container } from '@/components/site/layout-primitives';
import { TrackedLink } from '@/components/site/tracked-link';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { TiltIn } from '@/components/site/visuals/tilt-in';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export function HomeHero({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="relative -mt-[var(--header-height)] overflow-hidden pt-[calc(var(--header-height)+3.5rem)] sm:pt-[calc(var(--header-height)+5rem)]">
      {/* Aurora in the logo's colours, behind the headline and the screenshot */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute top-[-12rem] left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_35%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[18rem] left-[8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_22%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[22rem] right-[6%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--coral)_20%,transparent),transparent)] blur-2xl" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-5xl text-center">
          <Link
            href={localePath(locale, '/connect/coros')}
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-white/70 py-1 pr-3 pl-1 text-[0.82rem] text-ink/80 shadow-[0_1px_2px_rgb(5_12_52/0.05)] backdrop-blur transition-colors hover:border-ink/20"
          >
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[0.68rem] font-medium tracking-wide text-white">
              AGPL
            </span>
            {m.home_hero_badge()}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* No entrance animation: the headline is the largest paint */}
          <h1 className="display-1 mt-7">
            {m.home_hero_title_1()}
            <br />
            <span className="brand-gradient-text">{m.home_hero_title_2()}</span>
          </h1>
          <p className="lead mx-auto mt-6 max-w-2xl">{m.home_hero_lead()}</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TrackedLink
              href={signupUrl('home_hero')}
              event="cta_clicked"
              properties={{ placement: 'home_hero', cta: 'signup' }}
              className={buttonStyles({
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              {m.home_hero_cta_primary()}
              <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
            </TrackedLink>
            <Link
              href={localePath(locale, '/pricing')}
              className={buttonStyles({
                variant: 'secondary',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              {m.home_hero_cta_secondary()}
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.85rem] text-muted-foreground">
            {[
              m.home_hero_proof_1(),
              m.home_hero_proof_2(),
              m.home_hero_proof_3(),
            ].map((proof) => (
              <li key={proof} className="flex items-center gap-1.5">
                <Check className="size-4 text-mint-strong" />
                {proof}
              </li>
            ))}
          </ul>
        </div>

        <PhoneShot
          src={shots.mobileHome}
          alt={m.home_hero_shot_alt()}
          priority
          className="relative mx-auto mt-12 w-[16.5rem] sm:hidden"
        />
        <TiltIn className="relative mx-auto mt-20 hidden max-w-[68rem] sm:block">
          <Screenshot
            src={shots.calendarMonth}
            alt={m.home_hero_shot_alt()}
            priority
            sizes="(min-width: 1100px) 1088px, 100vw"
          />
        </TiltIn>
      </Container>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}
