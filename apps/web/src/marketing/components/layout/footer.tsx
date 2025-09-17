import { m } from '@/paraglide/messages';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 py-10 text-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[var(--oa-muted)]">
          © {new Date().getFullYear()} OpenAthlete.{' '}
          {m.mkt_footer_rights() || ''}
        </p>
        <div className="flex gap-6">
          <a
            href="https://instagram.com/openathlete.fr"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--oa-muted)] hover:text-[var(--oa-accent)]"
          >
            {m.mkt_footer_instagram()}
          </a>
          <a
            href="/contact"
            className="text-[var(--oa-muted)] hover:text-[var(--oa-accent)]"
          >
            {m.mkt_nav_contact()}
          </a>
          <a
            href="mailto:tristan@tblt.fr"
            className="text-[var(--oa-muted)] hover:text-[var(--oa-accent)]"
          >
            {m.mkt_footer_email()}
          </a>
        </div>
      </div>
    </footer>
  );
}
