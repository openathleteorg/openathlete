import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { CorosAdapter } from './adapters/coros.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { SuuntoAdapter } from './adapters/suunto.adapter';
import { ProviderOAuthController } from './controllers/provider-oauth.controller';
import { ProviderExportService } from './export.service';
import { StravaProviderService } from './providers/strava.provider.service';
import { ProviderExportScheduler } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, EventEmitterModule],
  controllers: [ProviderOAuthController],
  providers: [
    PrismaService,
    GarminAdapter,
    SuuntoAdapter,
    CorosAdapter,
    ProviderExportService,
    ProviderExportScheduler,
    StravaProviderService,
  ],
  exports: [ProviderExportService, StravaProviderService],
})
export class ProvidersSyncModule {}
