import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CalendarModule } from '../calendar/calendar.module';
import { OAuthTokensModule } from '../mcp/auth/oauth-tokens.module';
import { MessagesModule } from '../messages/messages.module';
import { ProvidersSyncModule } from '../providers-sync/providers-sync.module';
import { QueueModule } from '../queue';
import { EventController } from './controllers';
import { ActivityDuplicatesController } from './controllers/activity-duplicates.controller';
import { ActivityFeedbackController } from './controllers/activity-feedback.controller';
import { AthleteController } from './controllers/athlete.controller';
import { CoachNoteController } from './controllers/coach-note.controller';
import { CoachController } from './controllers/coach.controller';
import { CycleController } from './controllers/cycle.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { EventTemplateFolderController } from './controllers/event-template-folder.controller';
import { EventTemplateController } from './controllers/event-template.controller';
import { ExerciseController } from './controllers/exercise.controller';
import { InjuryController } from './controllers/injury.controller';
import { ManualFitImportController } from './controllers/manual-fit-import.controller';
import { MetricController } from './controllers/metric.controller';
import { RecordController } from './controllers/record.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { TrainingLoadController } from './controllers/training-load.controller';
import { TrainingZoneController } from './controllers/training-zone.controller';
import { ActivityFileParserService } from './helpers/activity-file-parser.service';
import {
  CycleService,
  EventService,
  TrainingPlanService,
  WorkoutService,
} from './services';
import { ActivityCorrectionsService } from './services/activity-corrections.service';
import { ActivityDetailService } from './services/activity-detail.service';
import { ActivityDuplicateService } from './services/activity-duplicate.service';
import { ActivityFeedbackService } from './services/activity-feedback.service';
import { ActivityRecordsService } from './services/activity-records.service';
import { AthleteSettingsService } from './services/athlete-settings.service';
import { AthleteService } from './services/athlete.service';
import { CalendarFeedService } from './services/calendar-feed.service';
import { CoachNoteService } from './services/coach-note.service';
import { CoachService } from './services/coach.service';
import { CustomExerciseService } from './services/custom-exercise.service';
import { EquipmentService } from './services/equipment.service';
import { EventBatchService } from './services/event-batch.service';
import { EventBulkService } from './services/event-bulk.service';
import { EventSeriesService } from './services/event-series.service';
import { EventTemplateFolderService } from './services/event-template-folder.service';
import { EventTemplateService } from './services/event-template.service';
import { InjuryService } from './services/injury.service';
import { ManualActivityService } from './services/manual-activity.service';
import { ManualFitImportService } from './services/manual-fit-import.service';
import { MetricService } from './services/metric.service';
import { ActivityPipelineService } from './services/pipeline/activity-pipeline.service';
import {
  EquipmentProcessor,
  GapProcessor,
  IntensityProcessor,
  NormalizationProcessor,
  RecordsProcessor,
  TrainingMatchProcessor,
  WeatherProcessor,
} from './services/pipeline/processors';
import { RecordService } from './services/record.service';
import { StatisticsService } from './services/statistics.service';
import { StrengthSessionService } from './services/strength-session.service';
import { TrainingLoadService } from './services/training-load.service';
import { TrainingZoneService } from './services/training-zone.service';
import { OpenMeteoWeatherProvider } from './services/weather/providers/openmeteo.provider';
import { WeatherService } from './services/weather/weather.service';

@Module({
  imports: [
    AuthModule,
    OAuthTokensModule,
    forwardRef(() => CalendarModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => QueueModule),
    forwardRef(() => ProvidersSyncModule),
  ],
  controllers: [
    ExerciseController,
    ActivityDuplicatesController,
    ActivityFeedbackController,
    EventController,
    EventTemplateController,
    EventTemplateFolderController,
    AthleteController,
    CoachController,
    StatisticsController,
    RecordController,
    EquipmentController,
    CoachNoteController,
    InjuryController,
    MetricController,
    TrainingZoneController,
    TrainingLoadController,
    CycleController,
    ManualFitImportController,
  ],
  providers: [
    CustomExerciseService,
    StrengthSessionService,
    EventService,
    ActivityDuplicateService,
    ManualFitImportService,
    WorkoutService,
    EventTemplateService,
    EventTemplateFolderService,
    AthleteService,
    AthleteSettingsService,
    CoachService,
    StatisticsService,
    RecordService,
    EquipmentService,
    CoachNoteService,
    InjuryService,
    MetricService,
    TrainingZoneService,
    TrainingLoadService,
    TrainingPlanService,
    CycleService,
    WeatherService,
    ActivityFeedbackService,
    CalendarFeedService,
    EventBulkService,
    EventBatchService,
    EventSeriesService,
    ManualActivityService,
    ActivityCorrectionsService,
    OpenMeteoWeatherProvider,
    ActivityDetailService,
    ActivityFileParserService,
    // Pipeline and processors
    ActivityRecordsService,
    GapProcessor,
    RecordsProcessor,
    WeatherProcessor,
    NormalizationProcessor,
    TrainingMatchProcessor,
    EquipmentProcessor,
    IntensityProcessor,
    {
      provide: ActivityPipelineService,
      useFactory: (
        equipment: EquipmentProcessor,
        gap: GapProcessor,
        records: RecordsProcessor,
        weather: WeatherProcessor,
        normalization: NormalizationProcessor,
        trainingMatch: TrainingMatchProcessor,
        intensity: IntensityProcessor,
      ) =>
        new ActivityPipelineService([
          equipment,
          gap,
          records,
          weather,
          normalization,
          trainingMatch,
          intensity,
        ]),
      inject: [
        EquipmentProcessor,
        GapProcessor,
        RecordsProcessor,
        WeatherProcessor,
        NormalizationProcessor,
        TrainingMatchProcessor,
        IntensityProcessor,
      ],
    },
  ],
  exports: [
    EventService,
    ActivityDuplicateService,
    ActivityRecordsService,
    ActivityPipelineService,
    GapProcessor,
    IntensityProcessor,
    NormalizationProcessor,
    ActivityDetailService,
    TrainingLoadService,
    TrainingPlanService,
    CycleService,
    ActivityFileParserService,
    // For the MCP server's tools
    StatisticsService,
    EventBulkService,
    EventSeriesService,
    MetricService,
    RecordService,
    TrainingZoneService,
  ],
})
export class CoreModule {}
