import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { CorosAdapter } from './adapters/coros.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { SuuntoAdapter } from './adapters/suunto.adapter';
import { ProviderExportService } from './export.service';
import { ProviderExportScheduler } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule],
  providers: [
    PrismaService,
    GarminAdapter,
    SuuntoAdapter,
    CorosAdapter,
    ProviderExportService,
    ProviderExportScheduler,
  ],
  exports: [ProviderExportService],
})
export class ProvidersSyncModule {}
