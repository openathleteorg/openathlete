import {
  BUY_ME_A_COFFEE_URL,
  DISCORD_URL,
  DOCS_URL,
  GITHUB_URL,
  SELF_HOSTING_DOCS_URL,
} from '@/config';
import { COMPETITORS } from '@/content/competitors';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { CookieSettingsButton } from './cookie-settings';
import { CoffeeIcon, DiscordIcon, GithubIcon } from './icons';
import { Container } from './layout-primitives';
import { LocaleSwitcher } from './locale-switcher';
import { Logo } from './logo';
import { TrackedLink } from './tracked-link';

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="kicker mb-4 text-ink-soft">{title}</p>
      <ul className="grid gap-2.5 text-[0.9rem]">{children}</ul>
    </div>
  );
}

function Item({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith('http');
  return (
    <li>
      <Link
        href={href}
        className="text-white/70 transition-colors hover:text-white"
        {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      >
        {children}
      </Link>
    </li>
  );
}

export function Footer({ locale }: { locale: SupportedLocale }) {
  const p = (path: string) => localePath(locale, path);
  return (
    <footer className="ink-band relative overflow-hidden pt-20 pb-10">
      <div className="brand-gradient absolute inset-x-0 top-0 h-px opacity-60" />
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
          <div className="max-w-xs">
            <Logo tone="light" />
            <p className="mt-4 text-[0.92rem] leading-relaxed text-white/65">
              {m.site_footer_tagline()}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <TrackedLink
                href={GITHUB_URL}
                event="github_clicked"
                properties={{ placement: 'footer' }}
                aria-label="GitHub"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 hover:border-white/35 hover:text-white"
              >
                <GithubIcon className="size-4" />
              </TrackedLink>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener"
                aria-label="Discord"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 hover:border-white/35 hover:text-white"
              >
                <DiscordIcon className="size-4" />
              </a>
              <TrackedLink
                href={BUY_ME_A_COFFEE_URL}
                event="donation_clicked"
                properties={{ placement: 'footer' }}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#ffdd00] px-3.5 text-[0.82rem] font-medium whitespace-nowrap text-ink hover:bg-[#ffe433]"
              >
                <CoffeeIcon className="size-4" />
                {m.site_footer_coffee()}
              </TrackedLink>
            </div>
          </div>

          <Column title={m.site_footer_product()}>
            <Item href={p('/features')}>{m.site_nav_features()}</Item>
            <Item href={p('/features/ai-coach')}>{m.site_nav_ai()}</Item>
            <Item href={p('/ai/claude')}>{m.site_footer_with_claude()}</Item>
            <Item href={p('/ai/chatgpt')}>{m.site_footer_with_chatgpt()}</Item>
            <Item href={p('/connect')}>{m.site_nav_integrations()}</Item>
            <Item href={p('/pricing')}>{m.site_nav_pricing()}</Item>
            <Item href={p('/mobile')}>{m.site_nav_mobile()}</Item>
          </Column>

          <Column title={m.site_footer_use_cases()}>
            <Item href={p('/athletes')}>{m.site_nav_athletes()}</Item>
            <Item href={p('/coaches')}>{m.site_nav_coaches()}</Item>
            <Item href={p('/clubs')}>{m.site_nav_clubs()}</Item>
          </Column>

          <Column title={m.site_footer_compare()}>
            {COMPETITORS.map((competitor) => (
              <Item
                key={competitor.slug}
                href={p(`/compare/${competitor.slug}`)}
              >
                vs {competitor.name}
              </Item>
            ))}
            <Item href={p('/compare')}>{m.site_footer_all_comparisons()}</Item>
          </Column>

          <Column title={m.site_footer_resources()}>
            <Item href={p('/blog')}>{m.site_nav_blog()}</Item>
            <Item href={p('/tools')}>{m.site_nav_tools()}</Item>
            <Item href={p('/training-plans')}>
              {m.site_nav_training_plans()}
            </Item>
            <Item href={p('/pace-charts')}>{m.pacechart_nav_label()}</Item>
            <Item href={DOCS_URL}>{m.site_nav_docs()}</Item>
          </Column>

          <Column title={m.site_footer_project()}>
            <Item href={p('/open-source')}>{m.site_nav_open_source()}</Item>
            <Item href={GITHUB_URL}>{m.site_footer_github()}</Item>
            <Item href={SELF_HOSTING_DOCS_URL}>
              {m.site_footer_self_host()}
            </Item>
            <Item href={`${GITHUB_URL}/releases`}>
              {m.site_footer_status()}
            </Item>
            <Item href={DISCORD_URL}>{m.site_nav_community()}</Item>
          </Column>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-[0.82rem] text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} OpenAthlete. {m.site_footer_made_in()}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={p('/legal-notice')} className="hover:text-white">
              {m.site_footer_legal()}
            </Link>
            <Link href={p('/privacy-policy')} className="hover:text-white">
              {m.site_footer_privacy()}
            </Link>
            <Link href={p('/terms-of-sale')} className="hover:text-white">
              {m.site_footer_terms()}
            </Link>
            <CookieSettingsButton className="hover:text-white" />
            <div className="[&_button]:text-white/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
