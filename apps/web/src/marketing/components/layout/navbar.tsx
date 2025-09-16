import whiteLogoSrc from '@/assets/logos/logo_white.svg';
import { m } from '@/paraglide/messages';
import { Instagram } from 'lucide-react';

import { LanguageSwitcher } from './language-switcher';

const navItems = [
  { href: '/', key: 'mkt_nav_home' },
  { href: '/services', key: 'mkt_nav_services' },
  { href: '/about', key: 'mkt_nav_about' },
  { href: '/contact', key: 'mkt_nav_contact' },
];

export function Navbar() {
  return (
    <header className="w-full border-b border-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <img src={whiteLogoSrc} alt="Logo" className="h-9 w-9" />
            <a
              href="/"
              className="text-lg font-semibold tracking-wide text-[var(--oa-fg)]"
            >
              OpenAthlete
            </a>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            {navItems.map((item) => {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className="text-[var(--oa-muted)] hover:text-[var(--oa-fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oa-accent)] rounded"
                >
                  {(m as any)[item.key]?.() || item.key}
                </a>
              );
            })}
            <a
              href="https://instagram.com/openathlete.fr"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--oa-muted)] hover:text-[var(--oa-accent)] flex items-center gap-1"
            >
              <Instagram className="size-4" />{' '}
              {m.mkt_footer_instagram() || 'Instagram'}
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <a
            href="/auth/login"
            className="hidden sm:inline-block rounded-md bg-[var(--oa-accent)] px-4 py-2 text-sm font-medium text-[var(--oa-bg)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--oa-accent)] ring-offset-[var(--oa-bg)] transition"
          >
            {m.login() || 'Login'}
          </a>
        </div>
      </div>
    </header>
  );
}
