export const questionnaireKeys = {
  root: 'QuestionnaireAPI',
  list: (archived: boolean) =>
    ['QuestionnaireAPI', 'list', archived ? 'archived' : 'active'] as const,
  detail: (questionnaireId: number) =>
    ['QuestionnaireAPI', 'detail', questionnaireId] as const,
  pending: ['QuestionnaireAPI', 'pending'] as const,
  ofEvent: (eventId: number) => ['QuestionnaireAPI', 'event', eventId] as const,
  responses: (query: {
    athleteId?: number;
    questionnaireId?: number;
    from: string;
    to: string;
  }) => ['QuestionnaireAPI', 'responses', query] as const,
} as const;
