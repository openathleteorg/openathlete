import { m } from '@/paraglide/messages';

import { ContactForm } from '../components/ui/contact-form';
import { Section } from '../components/ui/section';
import { Seo } from '../lib/seo';

export default function ContactPage() {
  return (
    <>
      <Seo
        title={m.mkt_contact_title?.()}
        description={m.mkt_contact_intro?.()}
        url={typeof window !== 'undefined' ? window.location.href : undefined}
      />
      <Section title="mkt_contact_title">
        <p className="mb-8 max-w-xl text-sm text-[var(--oa-muted)]">
          {m.mkt_contact_intro?.() || ''}
        </p>
        <ContactForm />
      </Section>
    </>
  );
}
