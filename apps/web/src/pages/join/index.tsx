import { m } from '@/paraglide/messages';
import { CoachJoinView } from '@/views/join/coach-join-view';

export default function CoachJoinPage() {
  return (
    <>
      <title>{m.join_link_page_meta_title()}</title>
      <CoachJoinView />
    </>
  );
}
