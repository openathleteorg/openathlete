export const activityFeedbackKeys = {
  root: 'ActivityFeedbackAPI',
  getFeedbackQuestions: (eventId: number) => [
    activityFeedbackKeys.root,
    'getFeedbackQuestions',
    eventId,
  ],
  submitAnswer: (eventId: number, questionId: number) => [
    activityFeedbackKeys.root,
    'submitAnswer',
    eventId,
    questionId,
  ],
} as const;
