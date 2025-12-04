import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { ArrowRight } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type ErrorPageProps = {
  code: string;
  title: string;
  description: string;
};

export function ErrorPage({ code, title, description }: ErrorPageProps) {
  const { authenticated, loading } = useAuthContext();
  const navigate = useNavigate();

  const handleRedirect = useCallback(() => {
    if (loading) return;
    const target = authenticated ? getPath(['dashboard']) : '/';
    navigate(target, { replace: true });
  }, [authenticated, loading, navigate]);

  const ctaLabel = authenticated
    ? m.error_page_cta_dashboard()
    : m.error_page_cta_marketing();

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {code}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          size="lg"
          className="gap-3"
          onClick={handleRedirect}
          isLoading={loading}
        >
          {ctaLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
