import { m } from '@/paraglide/messages';

export default function PrivacyPolicyPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-8">
      <title>{m.privacy_policy_title()}</title>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{m.privacy_policy_title()}</h1>
        <p className="text-sm text-muted-foreground">
          {m.privacy_policy_last_updated({ date: today })}
        </p>
      </header>

      <section className="prose prose-neutral dark:prose-invert">
        <p>{m.privacy_policy_intro()}</p>

        <h2>{m.privacy_policy_data_we_collect_title()}</h2>
        <ul>
          <li>{m.privacy_policy_data_we_collect_list_1()}</li>
          <li>{m.privacy_policy_data_we_collect_list_2()}</li>
          <li>{m.privacy_policy_data_we_collect_list_3()}</li>
          <li>{m.privacy_policy_data_we_collect_list_4()}</li>
          <li>{m.privacy_policy_data_we_collect_list_5()}</li>
          <li>{m.privacy_policy_data_we_collect_list_6()}</li>
          <li>{m.privacy_policy_data_we_collect_list_7()}</li>
          <li>{m.privacy_policy_data_we_collect_list_8()}</li>
        </ul>

        <h2>{m.privacy_policy_how_we_use_title()}</h2>
        <ul>
          <li>{m.privacy_policy_how_we_use_list_1()}</li>
          <li>{m.privacy_policy_how_we_use_list_2()}</li>
          <li>{m.privacy_policy_how_we_use_list_3()}</li>
          <li>{m.privacy_policy_how_we_use_list_4()}</li>
          <li>{m.privacy_policy_how_we_use_list_5()}</li>
          <li>{m.privacy_policy_how_we_use_list_6()}</li>
        </ul>

        <h2>{m.privacy_policy_legal_basis_title()}</h2>
        <ul>
          <li>{m.privacy_policy_legal_basis_list_1()}</li>
          <li>{m.privacy_policy_legal_basis_list_2()}</li>
          <li>{m.privacy_policy_legal_basis_list_3()}</li>
        </ul>

        <h2>{m.privacy_policy_sharing_title()}</h2>
        <ul>
          <li>{m.privacy_policy_sharing_list_1()}</li>
          <li>{m.privacy_policy_sharing_list_2()}</li>
          <li>{m.privacy_policy_sharing_list_3()}</li>
          <li>{m.privacy_policy_sharing_list_4()}</li>
        </ul>

        <h2>{m.privacy_policy_data_retention_title()}</h2>
        <p>{m.privacy_policy_data_retention_content()}</p>

        <h2>{m.privacy_policy_security_title()}</h2>
        <p>{m.privacy_policy_security_content()}</p>

        <h2>{m.privacy_policy_international_transfers_title()}</h2>
        <p>{m.privacy_policy_international_transfers_content()}</p>

        <h2>{m.privacy_policy_your_rights_title()}</h2>
        <ul>
          <li>{m.privacy_policy_your_rights_list_1()}</li>
          <li>{m.privacy_policy_your_rights_list_2()}</li>
          <li>{m.privacy_policy_your_rights_list_3()}</li>
        </ul>

        <h2>{m.privacy_policy_children_title()}</h2>
        <p>{m.privacy_policy_children_content()}</p>

        <h2>{m.privacy_policy_changes_title()}</h2>
        <p>{m.privacy_policy_changes_content()}</p>

        <h2>{m.privacy_policy_contact_title()}</h2>
        <p>{m.privacy_policy_contact_content()}</p>
      </section>
    </div>
  );
}
