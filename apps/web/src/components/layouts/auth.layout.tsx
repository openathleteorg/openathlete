import authBackground from '@/assets/images/auth/background.webp';
import whiteLogoSrc from '@/assets/logos/logo_white.svg';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from 'react-router-dom';

interface P {
  children: React.ReactNode;
}

export function AuthLayout({ children }: P) {
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL || '/';
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 justify-start gap-2">
            <Link
              to={websiteUrl}
              className="flex items-center gap-2 font-medium"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--oa-bg)] text-primary-foreground">
                <img src={whiteLogoSrc} alt="Logo" className="h-6 w-6" />
              </div>
              OpenAthlete
            </Link>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={authBackground}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
