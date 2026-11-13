import { m } from '@/paraglide/messages';
import { ClubJoinView } from '@/views/join/club-join-view';

export default function ClubJoinPage() {
  return (
    <>
      <title>{m.club_join_meta_title()}</title>
      <ClubJoinView />
    </>
  );
}
