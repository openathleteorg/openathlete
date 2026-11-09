import { m } from '@/paraglide/messages';
import { UnsubscribeView } from '@/views/emails/unsubscribe-view';

export default function UnsubscribePage() {
  return (
    <>
      <title>{m.unsubscribe_title()}</title>
      <UnsubscribeView />
    </>
  );
}
