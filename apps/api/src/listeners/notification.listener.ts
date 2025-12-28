import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EmailId } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events/send-email.event';
import { NotificationService } from 'src/modules/notification';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(SendEmailEvent.SLUG, { async: true })
  //@ts-ignore
  private async handleSendEmail<T extends EmailId>(event: SendEmailEvent<T>) {
    await this.notificationService.sendEmail(event.payload);
  }
}
