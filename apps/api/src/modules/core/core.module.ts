import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CalendarModule } from '../calendar/calendar.module';
import { MessagesModule } from '../messages/messages.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { ProvidersSyncModule } from '../providers-sync/providers-sync.module';
import { QueueModule } from '../queue';
import { EventController } from './controllers';
import { ActivityFeedbackController } from './controllers/activity-feedback.controller';
import { AthleteController } from './controllers/athlete.controller';
import { CoachController } from './controllers/coach.controller';
import { CycleController } from './controllers/cycle.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { EventTemplateFolderController } from './controllers/event-template-folder.controller';
import { EventTemplateController } from './controllers/event-template.controller';
import { InjuryController } from './controllers/injury.controller';
import { MetricController } from './controllers/metric.controller';
import { ProgressionController } from './controllers/progression.controller';
import { RecordController } from './controllers/record.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { TrainingLoadController } from './controllers/training-load.controller';
import { TrainingZoneController } from './controllers/training-zone.controller';
import { ActivityFileParserService } from './helpers/activity-file-parser.service';
import { CycleService, EventService } from './services';
import { ActivityDetailService } from './services/activity-detail.service';
import { ActivityFeedbackService } from './services/activity-feedback.service';
import { AthleteSettingsService } from './services/athlete-settings.service';
import { AthleteService } from './services/athlete.service';
import { CoachService } from './services/coach.service';
import { EquipmentService } from './services/equipment.service';
import { EventTemplateFolderService } from './services/event-template-folder.service';
import { EventTemplateService } from './services/event-template.service';
import { InjuryService } from './services/injury.service';
import { MetricService } from './services/metric.service';
import { ActivityPipelineService } from './services/pipeline/activity-pipeline.service';
import {
  GapProcessor,
  NormalizationProcessor,
  TrainingMatchProcessor,
  WeatherProcessor,
} from './services/pipeline/processors';
import { ProgressionService } from './services/progression.service';
import { RecordService } from './services/record.service';
import { StatisticsService } from './services/statistics.service';
import { TrainingLoadService } from './services/training-load.service';
import { TrainingZoneService } from './services/training-zone.service';
import { OpenMeteoWeatherProvider } from './services/weather/providers/openmeteo.provider';
import { WeatherService } from './services/weather/weather.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CalendarModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => QueueModule),
    forwardRef(() => ProvidersSyncModule),
  ],
  controllers: [
    ActivityFeedbackController,
    EventController,
    EventTemplateController,
    EventTemplateFolderController,
    AthleteController,
    CoachController,
    StatisticsController,
    ProgressionController,
    RecordController,
    EquipmentController,
    InjuryController,
    MetricController,
    TrainingZoneController,
    TrainingLoadController,
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
    ProgressionService,
    PrismaService,
    RecordService,
    EquipmentService,
    InjuryService,
    MetricService,
    TrainingZoneService,
    TrainingLoadService,
    CycleService,
    WeatherService,
    ActivityFeedbackService,
    OpenMeteoWeatherProvider,
    ActivityDetailService,
    ActivityFileParserService,
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
    ActivityFileParserService,
  ],
})
export class CoreModule {}
