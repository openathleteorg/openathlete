import { m } from '@/paraglide/messages';

export default function LegalNoticePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-8">
      <title>{m.legal_notice_title()}</title>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{m.legal_notice_title()}</h1>
        <p className="text-sm text-muted-foreground">
          {m.legal_notice_last_updated({ date: today })}
        </p>
      </header>

      <section className="prose prose-neutral dark:prose-invert">
        <h2>{m.legal_notice_identification_title()}</h2>
        <p>{m.legal_notice_identification_content()}</p>
        <ul>
          <li>{m.legal_notice_identification_list_1()}</li>
          <li>{m.legal_notice_identification_list_2()}</li>
          <li>{m.legal_notice_identification_list_3()}</li>
          <li>{m.legal_notice_identification_list_4()}</li>
          <li>{m.legal_notice_identification_list_5()}</li>
        </ul>

        <h2>{m.legal_notice_publication_director_title()}</h2>
        <p>{m.legal_notice_publication_director_content()}</p>

        <h2>{m.legal_notice_hosting_title()}</h2>
        <p>{m.legal_notice_hosting_content()}</p>
        <ul>
          <li>{m.legal_notice_hosting_list_1()}</li>
          {m.legal_notice_hosting_list_2() && (
            <li>{m.legal_notice_hosting_list_2()}</li>
          )}
        </ul>

        <h2>{m.legal_notice_contact_title()}</h2>
        <p>{m.legal_notice_contact_content()}</p>

        <h2>{m.legal_notice_intellectual_property_title()}</h2>
        <p>{m.legal_notice_intellectual_property_content()}</p>

        <h2>{m.legal_notice_liability_title()}</h2>
        <p>{m.legal_notice_liability_content()}</p>

        <h2>{m.legal_notice_accessibility_title()}</h2>
        <p>{m.legal_notice_accessibility_content()}</p>

        <h2>{m.legal_notice_applicable_law_title()}</h2>
        <p>{m.legal_notice_applicable_law_content()}</p>

        <h2>{m.legal_notice_dispute_resolution_title()}</h2>
        <p>{m.legal_notice_dispute_resolution_content()}</p>
      </section>
    </div>
  );
}
