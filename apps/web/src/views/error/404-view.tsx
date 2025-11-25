import { m } from '@/paraglide/messages';

import { ErrorPage } from './error-page';

export function View404() {
  return (
    <ErrorPage
      code="404"
      title={m.error_page_404_title()}
      description={m.error_page_404_description()}
    />
  );
}
