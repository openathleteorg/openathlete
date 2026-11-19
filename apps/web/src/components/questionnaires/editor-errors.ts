import { m } from '@/paraglide/messages';

/**
 * The questionnaire is checked by its shared schema, whose messages are
 * English for the API: the editor shows them in the coach's language.
 */
const MESSAGES: Record<string, () => string> = {
  'The end of the scale must be above its start': () =>
    m.questionnaire_issue_scale_range(),
  'The scale has too many points': () => m.questionnaire_issue_scale_points(),
  'The maximum must be above the minimum': () =>
    m.questionnaire_issue_number_range(),
  'Two options share an id': () => m.questionnaire_issue_options(),
  'Only scale questions count in the score': () =>
    m.questionnaire_issue_score_type(),
  'Only scale and number questions fill a metric': () =>
    m.questionnaire_issue_metric_type(),
  'A score needs at least one question counted in it': () =>
    m.questionnaire_issue_score_empty(),
  'Questions count in a score the questionnaire does not have': () =>
    m.questionnaire_issue_score_none(),
  'Only a score fills a metric': () => m.questionnaire_issue_score_metric(),
  'The questions of the score must share one scale': () =>
    m.questionnaire_issue_score_scales(),
  'Two answers would fill the same metric': () =>
    m.questionnaire_issue_metric_twice(),
};

/** A field's error in the coach's language; Zod's own ones as "invalid" */
export function editorErrorMessage(message?: string): string | undefined {
  if (!message) return undefined;
  const known = MESSAGES[message];
  if (known) return known();
  if (/at least 1|String must contain at least/i.test(message)) {
    return m.required();
  }
  if (/at least 2|Array must contain at least 2/i.test(message)) {
    return m.questionnaire_issue_two_options();
  }
  return m.questionnaire_issue_invalid();
}
