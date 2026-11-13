import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { NotificationModule } from '../notification/notification.module';
import { AthleteGroupController } from './athlete-group.controller';
import { AthleteGroupService } from './athlete-group.service';
import { ClubInvitationService } from './club-invitation.service';
import { ClubJoinLinkService } from './club-join-link.service';
import { ClubSessionController } from './club-session.controller';
import { ClubSessionService } from './club-session.service';
import { ClubController, ClubJoinController } from './club.controller';
import { ClubService } from './club.service';

@Module({
  imports: [AuthModule, CoreModule, NotificationModule],
  controllers: [
    ClubController,
    ClubJoinController,
    AthleteGroupController,
    ClubSessionController,
  ],
  providers: [
    ClubService,
    ClubJoinLinkService,
    ClubInvitationService,
    AthleteGroupService,
    ClubSessionService,
  ],
})
export class ClubModule {}
