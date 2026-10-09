import client, { routes } from '@/utils/axios';

import {
  EventComment,
  EventCommentCount,
  EventComments,
} from '@openathlete/shared';

const withDate = (comment: EventComment): EventComment => ({
  ...comment,
  createdAt: new Date(comment.createdAt),
});

export class EventCommentsAPI {
  static async getCounts(
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<EventCommentCount[]> {
    const res = await client.get(routes.messages.eventCommentCounts, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        athleteId,
      },
    });
    return res.data;
  }

  static async list(eventId: number): Promise<EventComments> {
    const res = await client.get<EventComments>(
      routes.messages.eventComments(eventId),
    );
    return { ...res.data, comments: res.data.comments.map(withDate) };
  }

  static async add(eventId: number, content: string): Promise<EventComment> {
    const res = await client.post<EventComment>(
      routes.messages.eventComments(eventId),
      { content },
    );
    return withDate(res.data);
  }

  static async markRead(eventId: number): Promise<void> {
    await client.post(routes.messages.eventCommentsRead(eventId));
  }
}
