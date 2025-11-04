import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-6 w-auto" />
            <span className="text-xl font-bold tracking-tight">
              OpenAthlete
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="#how-it-works">{m.landing_hero_cta_secondary()}</a>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </Container>
    </nav>
  );
}
