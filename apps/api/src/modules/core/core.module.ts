import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { EventController } from './controllers';
import { AthleteController } from './controllers/athlete.controller';
import { ConnectorController } from './controllers/connector.controller';
import { ContactController } from './controllers/contact.controller';
import { CycleController } from './controllers/cycle.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { EventTemplateController } from './controllers/event-template.controller';
import { MetricController } from './controllers/metric.controller';
import { RecordController } from './controllers/record.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { TrainingZoneController } from './controllers/training-zone.controller';
import { CycleService, EventService } from './services';
import { ActivityDetailService } from './services/activity-detail.service';
import { AthleteService } from './services/athlete.service';
import { StravaConnectorService } from './services/connector/strava.service';
import { ContactService } from './services/contact.service';
import { EquipmentService } from './services/equipment.service';
import { EventTemplateService } from './services/event-template.service';
import { MetricService } from './services/metric.service';
import { ActivityPipelineService } from './services/pipeline/activity-pipeline.service';
import { GapProcessor } from './services/pipeline/processors/gap.processor';
import { NormalizationProcessor } from './services/pipeline/processors/normalization.processor';
import { WeatherProcessor } from './services/pipeline/processors/weather.processor';
import { RecordService } from './services/record.service';
import { StatisticsService } from './services/statistics.service';
import { TrainingZoneService } from './services/training-zone.service';
import { OpenMeteoWeatherProvider } from './services/weather/providers/openmeteo.provider';
import { WeatherService } from './services/weather/weather.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [
    EventController,
    EventTemplateController,
    ConnectorController,
    AthleteController,
    StatisticsController,
    RecordController,
    EquipmentController,
    MetricController,
    TrainingZoneController,
    ContactController,
    CycleController,
  ],
  providers: [
    EventService,
    EventTemplateService,
    StravaConnectorService,
    AthleteService,
    StatisticsService,
    PrismaService,
    RecordService,
    EquipmentService,
    MetricService,
    TrainingZoneService,
    ContactService,
    CycleService,
    WeatherService,
    OpenMeteoWeatherProvider,
    ActivityDetailService,
    // Pipeline and processors
    GapProcessor,
    WeatherProcessor,
    NormalizationProcessor,
    {
      provide: ActivityPipelineService,
      useFactory: (
        prisma: PrismaService,
        gap: GapProcessor,
        weather: WeatherProcessor,
        normalization: NormalizationProcessor,
      ) => new ActivityPipelineService(prisma, [gap, weather, normalization]),
      inject: [
        PrismaService,
        GapProcessor,
        WeatherProcessor,
        NormalizationProcessor,
      ],
    },
  ],
  exports: [EventService, ActivityPipelineService, ActivityDetailService],
})
export class CoreModule {}
