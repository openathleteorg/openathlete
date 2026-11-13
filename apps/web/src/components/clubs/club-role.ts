import { m } from '@/paraglide/messages';

import { ClubRole } from '@openathlete/shared';

export function clubRoleLabel(role: ClubRole): string {
  switch (role) {
    case 'OWNER':
      return m.club_role_owner();
    case 'ADMIN':
      return m.club_role_admin();
    case 'COACH':
      return m.club_role_coach();
    case 'ASSISTANT':
      return m.club_role_assistant();
    case 'ATHLETE':
      return m.club_role_athlete();
  }
}
