import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { m } from '@/paraglide/messages';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo className="h-6 w-auto" />
              <span className="text-lg font-semibold tracking-tight">
                OpenAthlete
              </span>
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link
                to="/legal-notice"
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[0]}
              </Link>
              <Link
                to="/privacy-policy"
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[1]}
              </Link>
              <a
                href="mailto:contact@openathlete.org"
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[2]}
              </a>
            </nav>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OpenAthlete. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
