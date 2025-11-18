import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/services/prisma.service';
import { NotificationService } from './services';

@Module({
  providers: [NotificationService, PrismaService],
  controllers: [],
  exports: [NotificationService],
})
export class NotificationModule {}
