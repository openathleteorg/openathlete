import client, { routes } from '@/utils/axios';

import {
  CreateEventTemplateDto,
  Event,
  EventTemplate,
  UpdateEventTemplateDto,
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

  /** The user's own templates, or a club's library with clubId */
  static async getMyEventTemplates(
    search?: string,
    clubId?: number | null,
  ): Promise<EventTemplate[]> {
    const res = await client.get(routes.eventTemplate.getMyTemplates, {
      params: { search, ...(clubId && { clubId }) },
    });
    return res.data;
  }

  static async updateEventTemplate({
    eventTemplateId,
    body,
  }: {
    eventTemplateId: EventTemplate['eventTemplateId'];
    body: UpdateEventTemplateDto;
  }): Promise<EventTemplate> {
    const res = await client.patch(
      routes.eventTemplate.update(eventTemplateId),
      body,
    );
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
