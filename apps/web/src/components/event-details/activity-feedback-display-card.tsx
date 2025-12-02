import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';

import { ActivityEvent, ActivityFeedbackQuestion } from '@openathlete/shared';

interface P {
  event: ActivityEvent;
}

export function ActivityFeedbackDisplayCard({ event }: P) {
  const questions = event.feedbackQuestions ?? [];
  const answeredQuestions = questions.filter(
    (q: ActivityFeedbackQuestion) =>
      q.answerText !== null && q.answerText !== '',
  );

  return (
    <Card className="col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle>{m.activity_feedback_completed_via_questions()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {answeredQuestions.map((question: ActivityFeedbackQuestion) => (
          <div key={question.activityFeedbackQuestionId} className="space-y-2">
            <p className="text-sm font-medium">{question.questionText}</p>
            <p className="text-sm text-muted-foreground">
              {question.answerText}
            </p>
          </div>
        ))}
        {answeredQuestions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {m.activity_feedback_no_feedback()}
          </p>
        )}
        {event.description && event.description.trim() !== '' && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">{m.comment()}</p>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>
        )}
        {event.rpe !== null && event.rpe !== undefined && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">{m.rpe()}</p>
            <p className="text-sm text-muted-foreground">
              {Math.round(event.rpe * 10)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
