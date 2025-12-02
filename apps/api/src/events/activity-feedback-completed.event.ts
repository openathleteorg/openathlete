type ActivityFeedbackCompletedPayload = {
  eventActivityId: number;
  eventId: number;
  trigger: 'questions_completed' | 'rpe_comment_updated'; // What triggered this processing
};

export class ActivityFeedbackCompletedEvent {
  static SLUG = 'activity.feedback.completed';

  constructor(public readonly payload: ActivityFeedbackCompletedPayload) {}
}
