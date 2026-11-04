'use client';

import { DISCORD_URL, DOCS_URL, GITHUB_URL } from '@/config';
import { useLocale, useMessageLocale } from '@/i18n/client';
import { loginUrl, signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Bot,
  Building2,
  Calculator,
  ChevronDown,
  Flag,
  Gauge,
  LayoutGrid,
  Menu,
  MessagesSquare,
  Newspaper,
  Plug,
  Smartphone,
  Sparkles,
  Timer,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { buttonStyles } from './button';
import { GithubIcon } from './icons';
import { LocaleSwitcher } from './locale-switcher';
import { Logo } from './logo';
import { TrackedLink } from './tracked-link';

interface MenuItem {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  badge?: string;
  external?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

function useMenus(): { groups: MenuGroup[]; links: MenuItem[] } {
  const ml = useMessageLocale();
  const locale = useLocale();
  const p = (path: string) => localePath(locale, path);
  return {
    groups: [
      {
        id: 'product',
        label: m.site_nav_product({}, { locale: ml }),
        items: [
          {
            href: p('/features'),
            label: m.site_nav_features({}, { locale: ml }),
            description: m.site_nav_features_desc({}, { locale: ml }),
            icon: <LayoutGrid />,
          },
          {
            href: p('/features/ai-coach'),
            label: m.site_nav_ai({}, { locale: ml }),
            description: m.site_nav_ai_desc({}, { locale: ml }),
            icon: <Sparkles />,
          },
          {
            href: p('/ai/claude'),
            label: m.site_nav_assistants({}, { locale: ml }),
            description: m.site_nav_assistants_desc({}, { locale: ml }),
            icon: <Bot />,
          },
          {
            href: p('/connect'),
            label: m.site_nav_integrations({}, { locale: ml }),
            description: m.site_nav_integrations_desc({}, { locale: ml }),
            icon: <Plug />,
          },
          {
            href: p('/mobile'),
            label: m.site_nav_mobile({}, { locale: ml }),
            description: m.site_nav_mobile_desc({}, { locale: ml }),
            icon: <Smartphone />,
            badge: m.site_nav_soon({}, { locale: ml }),
          },
        ],
      },
      {
        id: 'use-cases',
        label: m.site_nav_use_cases({}, { locale: ml }),
        items: [
          {
            href: p('/athletes'),
            label: m.site_nav_athletes({}, { locale: ml }),
            description: m.site_nav_athletes_desc({}, { locale: ml }),
            icon: <UserRound />,
          },
          {
            href: p('/coaches'),
            label: m.site_nav_coaches({}, { locale: ml }),
            description: m.site_nav_coaches_desc({}, { locale: ml }),
            icon: <Users />,
          },
          {
            href: p('/clubs'),
            label: m.site_nav_clubs({}, { locale: ml }),
            description: m.site_nav_clubs_desc({}, { locale: ml }),
            icon: <Building2 />,
          },
        ],
      },
      {
        id: 'resources',
        label: m.site_nav_resources({}, { locale: ml }),
        items: [
          {
            href: p('/blog'),
            label: m.site_nav_blog({}, { locale: ml }),
            icon: <Newspaper />,
          },
          {
            href: p('/tools'),
            label: m.site_nav_tools({}, { locale: ml }),
            icon: <Calculator />,
          },
          {
            href: p('/training-plans'),
            label: m.site_nav_training_plans({}, { locale: ml }),
            icon: <Timer />,
          },
          {
            href: p('/pace-charts'),
            label: m.pacechart_nav_label({}, { locale: ml }),
            icon: <Gauge />,
          },
          {
            href: p('/races'),
            label: m.races_nav_label({}, { locale: ml }),
            icon: <Flag />,
          },
          {
            href: DOCS_URL,
            label: m.site_nav_docs({}, { locale: ml }),
            icon: <BookOpen />,
            external: true,
          },
          {
            href: DISCORD_URL,
            label: m.site_nav_community({}, { locale: ml }),
            icon: <MessagesSquare />,
            external: true,
          },
        ],
      },
    ],
    links: [
      {
        href: p('/pricing'),
        label: m.site_nav_pricing({}, { locale: ml }),
        icon: null,
      },
      {
        href: p('/compare'),
        label: m.site_nav_compare({}, { locale: ml }),
        icon: null,
      },
      {
        href: p('/open-source'),
        label: m.site_nav_open_source({}, { locale: ml }),
        icon: null,
      },
    ],
  };
}

function MenuLink({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate?: () => void;
}) {
  const className =
    'group/item flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-paper';
  const body = (
    <>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-white text-ink shadow-[0_1px_2px_rgb(5_12_52/0.05)] [&_svg]:size-4">
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[0.92rem] font-medium text-ink">
          {item.label}
          {item.badge && (
            <span className="rounded-full bg-mint/25 px-1.5 py-px text-[0.68rem] font-medium text-mint-strong">
              {item.badge}
            </span>
          )}
        </span>
        {item.description && (
          <span className="block text-[0.82rem] leading-snug text-muted-foreground">
            {item.description}
          </span>
        )}
      </span>
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener" className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

function Dropdown({ group }: { group: MenuGroup }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className="flex h-9 items-center gap-1 rounded-full px-3 text-[0.9rem] text-ink/80 transition-colors hover:bg-secondary hover:text-ink"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        {group.label}
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full left-1/2 z-50 w-[22rem] -translate-x-1/2 pt-2"
          >
            <div className="rounded-2xl border border-border bg-white p-2 shadow-[0_24px_48px_-20px_rgb(5_12_52/0.35)]">
              {group.items.map((item) => (
                <MenuLink
                  key={item.href}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const ml = useMessageLocale();
  const locale = useLocale();
  const pathname = usePathname();
  const { groups, links } = useMenus();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        {m.site_nav_skip({}, { locale: ml })}
      </a>
      <header
        className={cn(
          'sticky top-0 z-40 h-[var(--header-height)] transition-[background-color,box-shadow,backdrop-filter] duration-300',
          scrolled || mobileOpen
            ? 'bg-white/85 shadow-[0_1px_0_var(--border)] backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-full max-w-[80rem] items-center gap-6 px-5 sm:px-8">
          <Link
            href={localePath(locale, '')}
            aria-label="OpenAthlete"
            className="shrink-0"
          >
            <Logo />
          </Link>

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {groups.slice(0, 2).map((group) => (
              <Dropdown key={group.id} group={group} />
            ))}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex h-9 items-center rounded-full px-3 text-[0.9rem] text-ink/80 transition-colors hover:bg-secondary hover:text-ink',
                  pathname === link.href && 'text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Dropdown group={groups[2]} />
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <TrackedLink
              href={GITHUB_URL}
              event="github_clicked"
              properties={{ placement: 'header' }}
              className="hidden size-9 place-items-center rounded-full text-ink/70 transition-colors hover:bg-secondary hover:text-ink sm:grid"
              aria-label="GitHub"
            >
              <GithubIcon className="size-[18px]" />
            </TrackedLink>
            <LocaleSwitcher className="hidden sm:flex" />
            <a
              href={loginUrl()}
              className={cn(
                buttonStyles({ variant: 'ghost', size: 'sm' }),
                'hidden md:inline-flex',
              )}
            >
              {m.site_nav_login({}, { locale: ml })}
            </a>
            <TrackedLink
              href={signupUrl('header')}
              event="cta_clicked"
              properties={{ placement: 'header', cta: 'signup' }}
              className={cn(
                buttonStyles({ size: 'sm' }),
                'hidden min-[420px]:inline-flex',
              )}
            >
              {m.site_nav_start({}, { locale: ml })}
            </TrackedLink>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-secondary lg:hidden"
              aria-label={
                mobileOpen
                  ? m.site_nav_close({}, { locale: ml })
                  : m.site_nav_menu({}, { locale: ml })
              }
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[var(--header-height)] bottom-0 z-30 overflow-y-auto bg-white lg:hidden"
          >
            <nav
              className="flex flex-col gap-6 px-5 pt-4 pb-10"
              aria-label="Main"
            >
              {groups.map((group) => (
                <div key={group.id}>
                  <p className="kicker mb-2 px-2.5 text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-0.5">
                    {group.items.map((item) => (
                      <MenuLink
                        key={item.href}
                        item={item}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="grid gap-1 border-t border-border pt-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-2.5 py-2.5 text-lg font-medium text-ink hover:bg-paper"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                >
                  <GithubIcon /> GitHub
                </a>
              </div>
              <div className="grid gap-2">
                <TrackedLink
                  href={signupUrl('mobile_menu')}
                  event="cta_clicked"
                  properties={{ placement: 'mobile_menu', cta: 'signup' }}
                  className={buttonStyles({ size: 'lg' })}
                >
                  {m.site_nav_start({}, { locale: ml })}
                </TrackedLink>
                <a
                  href={loginUrl('mobile_menu')}
                  className={buttonStyles({ variant: 'secondary', size: 'lg' })}
                >
                  {m.site_nav_login({}, { locale: ml })}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
