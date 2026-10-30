import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth';
import { CoreModule } from '../core';
import { PrismaService } from '../prisma/services/prisma.service';
import { QueueModule } from '../queue';
import { CorosAdapter } from './adapters/coros.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { SuuntoAdapter } from './adapters/suunto.adapter';
import { ProviderOAuthController } from './controllers/provider-oauth.controller';
import { ProviderExportService } from './export.service';
import { GarminPersonalClient } from './garmin-personal/garmin-personal-client';
import {
  GarminPersonalController,
  GarminPersonalEnabledGuard,
} from './garmin-personal/garmin-personal-controller';
import {
  GarminPersonalProcessor,
  GarminPersonalScheduler,
} from './garmin-personal/garmin-personal-processor';
import { GarminPersonalService } from './garmin-personal/garmin-personal-service';
import {
  CorosProviderService,
  GarminProviderService,
  PolarProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from './providers';
import { ProviderExportScheduler } from './scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    forwardRef(() => CoreModule),
    EventEmitterModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [ProviderOAuthController, GarminPersonalController],
  providers: [
    PrismaService,
    GarminPersonalClient,
    GarminPersonalService,
    GarminPersonalEnabledGuard,
    ...(process.env.GARMIN_PERSONAL_API_ENABLED === 'true' &&
    process.env.ENABLE_ACTIVITY_IMPORT === 'true'
      ? [GarminPersonalProcessor, GarminPersonalScheduler]
      : []),
    GarminAdapter,
    SuuntoAdapter,
    CorosAdapter,
    ProviderExportService,
    ProviderExportScheduler,
    StravaProviderService,
    GarminProviderService,
    SuuntoProviderService,
    CorosProviderService,
    PolarProviderService,
  ],
  exports: [
    ProviderExportService,
    StravaProviderService,
    GarminProviderService,
    SuuntoProviderService,
    CorosProviderService,
    PolarProviderService,
  ],
})
export class ProvidersSyncModule {}
