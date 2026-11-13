import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { AthleteGroupController } from './athlete-group.controller';
import { AthleteGroupService } from './athlete-group.service';
import { ClubInvitationService } from './club-invitation.service';
import { ClubJoinLinkService } from './club-join-link.service';
import { ClubController, ClubJoinController } from './club.controller';
import { ClubService } from './club.service';

@Module({
  imports: [AuthModule],
  controllers: [ClubController, ClubJoinController, AthleteGroupController],
  providers: [
    ClubService,
    ClubJoinLinkService,
    ClubInvitationService,
    AthleteGroupService,
  ],
})
export class ClubModule {}
