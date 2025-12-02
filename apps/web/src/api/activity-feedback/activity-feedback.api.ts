import client, { routes } from '@/utils/axios';

import { Event } from '@openathlete/shared';

export interface ActivityFeedbackQuestion {
  questionId: number;
  questionText: string;
  qcmOptions: Array<{ label: string }> | null;
  answerText: string | null;
}

export interface ActivityFeedbackResponse {
  questions: ActivityFeedbackQuestion[];
  feedbackSkipped: boolean;
}

export interface SubmitAnswerDto {
  answerText: string;
}

export class ActivityFeedbackAPI {
  static async getFeedbackQuestions(
    eventId: Event['eventId'],
  ): Promise<ActivityFeedbackResponse> {
    const res = await client.get(
      routes.event.getActivityFeedbackQuestions(eventId),
    );
    return res.data;
  }

  static async submitAnswer(
    eventId: Event['eventId'],
    questionId: number,
    answerText: string,
  ): Promise<{ questionId: number; answerText: string }> {
    const res = await client.patch(
      routes.event.submitQuestionAnswer(eventId, questionId),
      { answerText },
    );
    return res.data;
  }

  static async skipFeedback(
    eventId: Event['eventId'],
  ): Promise<{ success: boolean }> {
    const res = await client.post(routes.event.skipFeedback(eventId));
    return res.data;
  }

  static async unskipFeedback(
    eventId: Event['eventId'],
  ): Promise<{ success: boolean }> {
    const res = await client.post(routes.event.unskipFeedback(eventId));
    return res.data;
  }
}
