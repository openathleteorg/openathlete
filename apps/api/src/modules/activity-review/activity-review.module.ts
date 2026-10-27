import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core';
import { PrismaService } from '../prisma/services/prisma.service';
import { ProvidersSyncModule } from '../providers-sync/providers-sync.module';
import { QueueModule } from '../queue';
import { ActivityReviewController } from './activity-review.controller';
import { ActivityReviewService } from './activity-review.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CoreModule),
    forwardRef(() => ProvidersSyncModule),
    forwardRef(() => QueueModule),
  ],
  controllers: [ActivityReviewController],
  providers: [PrismaService, ActivityReviewService],
})
export class ActivityReviewModule {}
