import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { ActivityAlertSettingsController } from './controllers/activity-alert-settings.controller';
import { EventCommentsController } from './controllers/event-comments.controller';
import { MessagesController } from './controllers/messages.controller';
import { MessagesGateway } from './gateways/messages.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { CoachActivityNoticeService } from './services/coach-activity-notice.service';
import { EventCommentService } from './services/event-comment.service';
import { MessageNotificationScheduler } from './services/message-notification.scheduler';
import { MessageThreadService } from './services/message-thread.service';
import { MessageService } from './services/message.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CoreModule),
    NotificationModule,
    WebSocketModule,
  ],
  controllers: [
    MessagesController,
    ActivityAlertSettingsController,
    EventCommentsController,
  ],
  providers: [
    CoachActivityNoticeService,
    EventCommentService,
    MessageThreadService,
    MessageService,
    MessagesGateway,
    WsJwtAuthGuard,
    PrismaService,
    MessageNotificationScheduler,
  ],
  exports: [MessageThreadService, MessageService],
})
export class MessagesModule {}
