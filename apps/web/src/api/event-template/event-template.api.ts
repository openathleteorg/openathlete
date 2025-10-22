import client, { routes } from '@/utils/axios';

import {
  CreateEventTemplateDto,
  Event,
  EventTemplate,
  UseEventTemplateDto,
} from '@openathlete/shared';

const mapEvent = (event: Event): Event => {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  };
};

export class EventTemplateAPI {
  static async createEventTemplate(
    body: CreateEventTemplateDto,
  ): Promise<Event> {
    const res = await client.post(routes.eventTemplate.create, body);
    return res.data;
  }

  static async getMyEventTemplates(): Promise<EventTemplate[]> {
    const res = await client.get(routes.eventTemplate.getMyTemplates);
    return res.data;
  }

  static async deleteEventTemplate(
    eventTemplateId: EventTemplate['eventTemplateId'],
  ): Promise<void> {
    await client.delete(routes.eventTemplate.delete(eventTemplateId));
  }

  static async useEventTemplate({
    eventTemplateId,
    body,
  }: {
    eventTemplateId: EventTemplate['eventTemplateId'];
    body: UseEventTemplateDto;
  }): Promise<Event> {
    const res = await client.post(
      routes.eventTemplate.use(eventTemplateId),
      body,
    );
    return mapEvent(res.data);
  }
}
