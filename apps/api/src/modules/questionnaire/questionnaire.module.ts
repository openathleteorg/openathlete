import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CalendarModule } from '../calendar/calendar.module';
import { CoreModule } from '../core/core.module';
import { NotificationModule } from '../notification/notification.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireNotificationScheduler } from './services/questionnaire-notification.scheduler';
import { QuestionnaireResponseService } from './services/questionnaire-response.service';
import { QuestionnaireService } from './services/questionnaire.service';

/**
 * Coaches' questionnaires: the library, the answers placed in calendars,
 * and the notifications telling athletes one is waiting.
 */
@Module({
  imports: [
    AuthModule,
    CoreModule,
    CalendarModule,
    NotificationModule,
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [QuestionnaireController],
  providers: [
    QuestionnaireService,
    QuestionnaireResponseService,
    QuestionnaireNotificationScheduler,
  ],
})
export class QuestionnaireModule {}
