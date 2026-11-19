import client, { routes } from '@/utils/axios';

import {
  type PendingQuestionnaire,
  type Questionnaire,
  type QuestionnaireForm,
  type QuestionnaireInput,
  type QuestionnaireResponses,
  type QuestionnaireSummary,
  type SubmitQuestionnaireAnswersDto,
  pendingQuestionnaireSchema,
  questionnaireFormSchema,
  questionnaireResponsesSchema,
  questionnaireSchema,
  questionnaireSummarySchema,
} from '@openathlete/shared';

export type ResponsesQuery = {
  athleteId?: number;
  questionnaireId?: number;
  /** ISO instants */
  from: string;
  to: string;
};

export class QuestionnaireAPI {
  static async list(archived = false): Promise<QuestionnaireSummary[]> {
    const res = await client.get(routes.questionnaire.list, {
      params: archived ? { archived: true } : undefined,
    });
    return questionnaireSummarySchema.array().parse(res.data);
  }

  static async get(questionnaireId: number): Promise<Questionnaire> {
    const res = await client.get(routes.questionnaire.get(questionnaireId));
    return questionnaireSchema.parse(res.data);
  }

  static async create(body: QuestionnaireInput): Promise<Questionnaire> {
    const res = await client.post(routes.questionnaire.create, body);
    return questionnaireSchema.parse(res.data);
  }

  static async update({
    questionnaireId,
    body,
  }: {
    questionnaireId: number;
    body: QuestionnaireInput;
  }): Promise<Questionnaire> {
    const res = await client.put(
      routes.questionnaire.update(questionnaireId),
      body,
    );
    return questionnaireSchema.parse(res.data);
  }

  static async archive(
    questionnaireId: number,
  ): Promise<{ removedOccurrences: number }> {
    const res = await client.post(
      routes.questionnaire.archive(questionnaireId),
    );
    return res.data as { removedOccurrences: number };
  }

  static async restore(questionnaireId: number): Promise<Questionnaire> {
    const res = await client.post(
      routes.questionnaire.restore(questionnaireId),
    );
    return questionnaireSchema.parse(res.data);
  }

  static async remove(questionnaireId: number): Promise<void> {
    await client.delete(routes.questionnaire.remove(questionnaireId));
  }

  static async pending(): Promise<PendingQuestionnaire[]> {
    const res = await client.get(routes.questionnaire.pending);
    return pendingQuestionnaireSchema.array().parse(res.data);
  }

  static async ofEvent(eventId: number): Promise<QuestionnaireForm> {
    const res = await client.get(routes.questionnaire.ofEvent(eventId));
    return questionnaireFormSchema.parse(res.data);
  }

  static async submit({
    eventId,
    body,
  }: {
    eventId: number;
    body: SubmitQuestionnaireAnswersDto;
  }): Promise<QuestionnaireForm> {
    const res = await client.put(routes.questionnaire.answers(eventId), body);
    return questionnaireFormSchema.parse(res.data);
  }

  static async responses(
    query: ResponsesQuery,
  ): Promise<QuestionnaireResponses> {
    const res = await client.get(routes.questionnaire.responses, {
      params: query,
    });
    return questionnaireResponsesSchema.parse(res.data);
  }
}
