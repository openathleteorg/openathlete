import { m } from '@/paraglide/messages';

import { ErrorPage } from './error-page';

export function View403() {
  return (
    <ErrorPage
      code="403"
      title={m.error_page_403_title()}
      description={m.error_page_403_description()}
    />
  );
}
