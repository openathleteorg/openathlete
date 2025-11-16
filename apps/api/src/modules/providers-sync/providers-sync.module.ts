import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { QueueModule } from '../queue';
import { CorosAdapter } from './adapters/coros.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { SuuntoAdapter } from './adapters/suunto.adapter';
import { ProviderOAuthController } from './controllers/provider-oauth.controller';
import { ProviderExportService } from './export.service';
import {
  CorosProviderService,
  GarminProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from './providers';
import { ProviderExportScheduler } from './scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    EventEmitterModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [ProviderOAuthController],
  providers: [
    PrismaService,
    GarminAdapter,
    SuuntoAdapter,
    CorosAdapter,
    ProviderExportService,
    ProviderExportScheduler,
    StravaProviderService,
    GarminProviderService,
    SuuntoProviderService,
    CorosProviderService,
  ],
  exports: [
    ProviderExportService,
    StravaProviderService,
    GarminProviderService,
    SuuntoProviderService,
    CorosProviderService,
  ],
})
export class ProvidersSyncModule {}
