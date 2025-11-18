import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth';
import { CalendarModule } from '../calendar/calendar.module';
import { MessagesModule } from '../messages/messages.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { QueueModule } from '../queue';
import { EventController } from './controllers';
import { AthleteController } from './controllers/athlete.controller';
import { BetaAccessController } from './controllers/beta-access.controller';
import { CoachController } from './controllers/coach.controller';
import { ContactController } from './controllers/contact.controller';
import { CycleController } from './controllers/cycle.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { EventTemplateFolderController } from './controllers/event-template-folder.controller';
import { EventTemplateController } from './controllers/event-template.controller';
import { MetricController } from './controllers/metric.controller';
import { RecordController } from './controllers/record.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { TrainingLoadController } from './controllers/training-load.controller';
import { TrainingZoneController } from './controllers/training-zone.controller';
import { CycleService, EventService } from './services';
import { ActivityDetailService } from './services/activity-detail.service';
import { AthleteSettingsService } from './services/athlete-settings.service';
import { AthleteService } from './services/athlete.service';
import { BetaAccessService } from './services/beta-access.service';
import { CoachService } from './services/coach.service';
import { ContactService } from './services/contact.service';
import { EquipmentService } from './services/equipment.service';
import { EventTemplateFolderService } from './services/event-template-folder.service';
import { EventTemplateService } from './services/event-template.service';
import { MetricService } from './services/metric.service';
import { ActivityPipelineService } from './services/pipeline/activity-pipeline.service';
import {
  GapProcessor,
  NormalizationProcessor,
  TrainingMatchProcessor,
  WeatherProcessor,
} from './services/pipeline/processors';
import { RecordService } from './services/record.service';
import { StatisticsService } from './services/statistics.service';
import { TrainingLoadService } from './services/training-load.service';
import { TrainingZoneService } from './services/training-zone.service';
import { OpenMeteoWeatherProvider } from './services/weather/providers/openmeteo.provider';
import { WeatherService } from './services/weather/weather.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    forwardRef(() => CalendarModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => QueueModule),
  ],
  controllers: [
    EventController,
    EventTemplateController,
    EventTemplateFolderController,
    AthleteController,
    CoachController,
    StatisticsController,
    RecordController,
    EquipmentController,
    MetricController,
    TrainingZoneController,
    TrainingLoadController,
    ContactController,
    BetaAccessController,
    CycleController,
  ],
  providers: [
    EventService,
    EventTemplateService,
    EventTemplateFolderService,
    AthleteService,
    AthleteSettingsService,
    CoachService,
    StatisticsService,
    PrismaService,
    RecordService,
    EquipmentService,
    MetricService,
    TrainingZoneService,
    TrainingLoadService,
    ContactService,
    BetaAccessService,
    CycleService,
    WeatherService,
    OpenMeteoWeatherProvider,
    ActivityDetailService,
    // Pipeline and processors
    GapProcessor,
    WeatherProcessor,
    NormalizationProcessor,
    TrainingMatchProcessor,
    {
      provide: ActivityPipelineService,
      useFactory: (
        prisma: PrismaService,
        gap: GapProcessor,
        weather: WeatherProcessor,
        normalization: NormalizationProcessor,
        trainingMatch: TrainingMatchProcessor,
      ) =>
        new ActivityPipelineService(prisma, [
          gap,
          weather,
          normalization,
          trainingMatch,
        ]),
      inject: [
        PrismaService,
        GapProcessor,
        WeatherProcessor,
        NormalizationProcessor,
        TrainingMatchProcessor,
      ],
    },
  ],
  exports: [
    EventService,
    ActivityPipelineService,
    ActivityDetailService,
    TrainingLoadService,
    CycleService,
  ],
})
export class CoreModule {}
