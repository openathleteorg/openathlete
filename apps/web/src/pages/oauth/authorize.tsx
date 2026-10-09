import { m } from '@/paraglide/messages';
import { OAuthConsentView } from '@/views/oauth/oauth-consent-view';

export function OAuthAuthorizePage() {
  return (
    <>
      <title>{m.mcp_tab()}</title>
      <OAuthConsentView />
    </>
  );
}
