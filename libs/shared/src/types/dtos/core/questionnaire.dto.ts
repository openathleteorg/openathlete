import { z } from 'zod';

import { METRIC_TYPE } from '../../misc';

export enum QUESTION_TYPE {
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  SCALE = 'SCALE',
  NUMBER = 'NUMBER',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  YES_NO = 'YES_NO',
}

export enum QUESTIONNAIRE_SCORE {
  NONE = 'NONE',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
}

export const QUESTIONNAIRE_TITLE_MAX = 120;
export const QUESTIONNAIRE_DESCRIPTION_MAX = 2000;
export const QUESTIONNAIRE_MAX_QUESTIONS = 40;
export const QUESTION_LABEL_MAX = 300;
export const QUESTION_HELP_MAX = 1000;
export const QUESTION_MAX_OPTIONS = 20;
export const QUESTION_OPTION_LABEL_MAX = 120;
export const SHORT_TEXT_ANSWER_MAX = 300;
export const LONG_TEXT_ANSWER_MAX = 5000;
/** Points of a scale: 1-20 is the widest coaches use, 0-100 the extreme */
export const SCALE_MAX_POINTS = 101;
/** The span the coach analysis reads at once */
export const QUESTIONNAIRE_RESPONSES_MAX_DAYS = 366;

/** Questions whose answer can count in the questionnaire's score */
export const SCORE_QUESTION_TYPES = [QUESTION_TYPE.SCALE] as const;
/** Questions whose answer can fill a metric */
export const METRIC_QUESTION_TYPES = [
  QUESTION_TYPE.SCALE,
  QUESTION_TYPE.NUMBER,
] as const;

/**
 * Metrics an answer can fill: those a person can tell, as opposed to those
 * a device measures. The answer is stored in the metric's unit
 * (metricUnitMap), so the form asks in that unit.
 */
export const QUESTIONNAIRE_METRIC_TYPES = [
  METRIC_TYPE.WEIGHT,
  METRIC_TYPE.BODY_FAT,
  METRIC_TYPE.SLEEP_DURATION,
  METRIC_TYPE.SLEEP_SCORE,
  METRIC_TYPE.NAP_DURATION,
  METRIC_TYPE.HOOPER_INDEX,
  METRIC_TYPE.HR_REST,
  METRIC_TYPE.HRV_LAST_NIGHT_AVG,
  METRIC_TYPE.RMSSD,
] as const;
const questionnaireMetricSchema = z
  .enum(QUESTIONNAIRE_METRIC_TYPES)
  .nullable()
  .default(null);

// ---------------------------------------------------------------------------
// Question settings, per type
// ---------------------------------------------------------------------------

const label = (max: number) => z.string().trim().max(max);

export const scaleConfigSchema = z
  .object({
    min: z.number().int().min(-100).max(100),
    max: z.number().int().min(-100).max(100),
    step: z.union([z.literal(0.5), z.literal(1)]).default(1),
    /** What the ends of the scale mean ("Very fresh", "Exhausted") */
    minLabel: label(60).default(''),
    maxLabel: label(60).default(''),
    /** Buttons for short scales, a slider for long ones */
    display: z.enum(['BUTTONS', 'SLIDER']).default('BUTTONS'),
  })
  .refine((config) => config.max > config.min, {
    message: 'The end of the scale must be above its start',
    path: ['max'],
  })
  .refine(
    (config) => (config.max - config.min) / config.step + 1 <= SCALE_MAX_POINTS,
    { message: 'The scale has too many points', path: ['max'] },
  );
export type ScaleConfig = z.infer<typeof scaleConfigSchema>;

export const numberConfigSchema = z
  .object({
    unit: label(20).default(''),
    min: z.number().nullable().default(null),
    max: z.number().nullable().default(null),
    decimals: z.number().int().min(0).max(3).default(1),
  })
  .refine(
    (config) =>
      config.min === null || config.max === null || config.max > config.min,
    { message: 'The maximum must be above the minimum', path: ['max'] },
  );
export type NumberConfig = z.infer<typeof numberConfigSchema>;

export const choiceOptionSchema = z.object({
  /** Stable: answers keep it when the label changes */
  id: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
  label: z.string().trim().min(1).max(QUESTION_OPTION_LABEL_MAX),
});
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

export const choiceConfigSchema = z.object({
  options: z
    .array(choiceOptionSchema)
    .min(2)
    .max(QUESTION_MAX_OPTIONS)
    .refine(
      (options) =>
        new Set(options.map((option) => option.id)).size === options.length,
      { message: 'Two options share an id' },
    ),
});
export type ChoiceConfig = z.infer<typeof choiceConfigSchema>;

const emptyConfigSchema = z.object({}).strip();

// ---------------------------------------------------------------------------
// Questions, as the coach writes them
// ---------------------------------------------------------------------------

const questionBaseSchema = z.object({
  /** An existing question, kept; absent for a new one */
  questionId: z.number().int().positive().optional(),
  label: z.string().trim().min(1).max(QUESTION_LABEL_MAX),
  help: label(QUESTION_HELP_MAX).default(''),
  required: z.boolean().default(true),
  inScore: z.boolean().default(false),
  metricType: questionnaireMetricSchema,
});

export const questionInputSchema = z.discriminatedUnion('type', [
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.SHORT_TEXT),
    config: emptyConfigSchema.default({}),
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.LONG_TEXT),
    config: emptyConfigSchema.default({}),
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.SCALE),
    config: scaleConfigSchema,
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.NUMBER),
    config: numberConfigSchema,
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.SINGLE_CHOICE),
    config: choiceConfigSchema,
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.MULTIPLE_CHOICE),
    config: choiceConfigSchema,
  }),
  questionBaseSchema.extend({
    type: z.literal(QUESTION_TYPE.YES_NO),
    config: emptyConfigSchema.default({}),
  }),
]);
export type QuestionInput = z.infer<typeof questionInputSchema>;
/** What the coach's form holds before validation fills the defaults */
export type QuestionInputDraft = z.input<typeof questionInputSchema>;

const isScoreType = (type: QUESTION_TYPE) =>
  (SCORE_QUESTION_TYPES as readonly QUESTION_TYPE[]).includes(type);
const isMetricType = (type: QUESTION_TYPE) =>
  (METRIC_QUESTION_TYPES as readonly QUESTION_TYPE[]).includes(type);

export const questionnaireInputSchema = z
  .object({
    title: z.string().trim().min(1).max(QUESTIONNAIRE_TITLE_MAX),
    description: label(QUESTIONNAIRE_DESCRIPTION_MAX).default(''),
    scoreKind: z
      .nativeEnum(QUESTIONNAIRE_SCORE)
      .default(QUESTIONNAIRE_SCORE.NONE),
    scoreMetricType: questionnaireMetricSchema,
    questions: z
      .array(questionInputSchema)
      .min(1)
      .max(QUESTIONNAIRE_MAX_QUESTIONS),
  })
  .superRefine((input, ctx) => {
    const scored = input.questions.filter((question) => question.inScore);
    input.questions.forEach((question, index) => {
      if (question.inScore && !isScoreType(question.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Only scale questions count in the score',
          path: ['questions', index, 'inScore'],
        });
      }
      if (question.metricType && !isMetricType(question.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Only scale and number questions fill a metric',
          path: ['questions', index, 'metricType'],
        });
      }
    });

    if (input.scoreKind !== QUESTIONNAIRE_SCORE.NONE && scored.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A score needs at least one question counted in it',
        path: ['scoreKind'],
      });
    }
    if (input.scoreKind === QUESTIONNAIRE_SCORE.NONE && scored.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Questions count in a score the questionnaire does not have',
        path: ['scoreKind'],
      });
    }
    if (input.scoreMetricType && input.scoreKind === QUESTIONNAIRE_SCORE.NONE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only a score fills a metric',
        path: ['scoreMetricType'],
      });
    }
    // Adding or averaging a 1-5 and a 1-10 means nothing
    const scales = new Set(
      scored.map((question) =>
        question.type === QUESTION_TYPE.SCALE
          ? `${question.config.min}:${question.config.max}`
          : '',
      ),
    );
    if (scales.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The questions of the score must share one scale',
        path: ['questions'],
      });
    }

    // One day holds one value of a metric
    const metrics = [
      ...input.questions.map((question) => question.metricType),
      input.scoreMetricType,
    ].filter((metric): metric is NonNullable<typeof metric> => metric !== null);
    if (new Set(metrics).size !== metrics.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Two answers would fill the same metric',
        path: ['questions'],
      });
    }

    const ids = input.questions
      .map((question) => question.questionId)
      .filter((id): id is number => id !== undefined);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A question appears twice',
        path: ['questions'],
      });
    }
  });
export type QuestionnaireInput = z.infer<typeof questionnaireInputSchema>;
export type QuestionnaireInputDraft = z.input<typeof questionnaireInputSchema>;

// ---------------------------------------------------------------------------
// Questionnaires, as the API returns them
// ---------------------------------------------------------------------------

const questionReadBase = z.object({
  questionId: z.number(),
  position: z.number(),
  label: z.string(),
  help: z.string(),
  required: z.boolean(),
  inScore: z.boolean(),
  metricType: z.nativeEnum(METRIC_TYPE).nullable(),
  /** Replaced or removed: kept for the answers already given */
  archivedAt: z.coerce.date().nullable(),
});

export const questionSchema = z.discriminatedUnion('type', [
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.SHORT_TEXT),
    config: emptyConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.LONG_TEXT),
    config: emptyConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.SCALE),
    config: scaleConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.NUMBER),
    config: numberConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.SINGLE_CHOICE),
    config: choiceConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.MULTIPLE_CHOICE),
    config: choiceConfigSchema,
  }),
  questionReadBase.extend({
    type: z.literal(QUESTION_TYPE.YES_NO),
    config: emptyConfigSchema,
  }),
]);
export type Question = z.infer<typeof questionSchema>;

export const questionnaireSchema = z.object({
  questionnaireId: z.number(),
  title: z.string(),
  description: z.string(),
  scoreKind: z.nativeEnum(QUESTIONNAIRE_SCORE),
  scoreMetricType: z.nativeEnum(METRIC_TYPE).nullable(),
  archivedAt: z.coerce.date().nullable(),
  /** False once the coach who wrote it deleted their account */
  hasCoach: z.boolean(),
  /** The current questions, in order; archived ones only in responses */
  questions: z.array(questionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Questionnaire = z.infer<typeof questionnaireSchema>;

/** A questionnaire of the coach's library, with how it is used */
export const questionnaireSummarySchema = questionnaireSchema
  .omit({ questions: true })
  .extend({
    questionCount: z.number(),
    /** Occurrences placed in calendars, past and coming */
    placedCount: z.number(),
    answeredCount: z.number(),
    lastAnsweredAt: z.coerce.date().nullable(),
  });
export type QuestionnaireSummary = z.infer<typeof questionnaireSummarySchema>;

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export const answerInputSchema = z.object({
  questionId: z.number().int().positive(),
  valueNumber: z.number().finite().nullable().default(null),
  valueText: z.string().max(LONG_TEXT_ANSWER_MAX).nullable().default(null),
  valueOptions: z
    .array(z.string().min(1).max(40))
    .max(QUESTION_MAX_OPTIONS)
    .default([]),
});
export type AnswerInput = z.infer<typeof answerInputSchema>;

export const submitQuestionnaireAnswersDtoSchema = z.object({
  answers: z.array(answerInputSchema).max(QUESTIONNAIRE_MAX_QUESTIONS),
});
export type SubmitQuestionnaireAnswersDto = z.infer<
  typeof submitQuestionnaireAnswersDtoSchema
>;

export const answerSchema = z.object({
  questionId: z.number(),
  valueNumber: z.number().nullable(),
  valueText: z.string().nullable(),
  valueOptions: z.array(z.string()),
});
export type Answer = z.infer<typeof answerSchema>;

export enum QUESTIONNAIRE_STATUS {
  /** Placed later on: not open yet */
  UPCOMING = 'UPCOMING',
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  /** Closed without an answer */
  MISSED = 'MISSED',
}

/** One questionnaire placed in a calendar, with its answers */
export const questionnaireOccurrenceSchema = z.object({
  eventId: z.number(),
  athleteId: z.number(),
  questionnaireId: z.number(),
  /** When it opens: the event's start */
  startDate: z.coerce.date(),
  /** When it stops taking a first answer: the next occurrence, or a week */
  closesAt: z.coerce.date(),
  answeredAt: z.coerce.date().nullable(),
  /** Until then the athlete can change their answers */
  editableUntil: z.coerce.date().nullable(),
  status: z.nativeEnum(QUESTIONNAIRE_STATUS),
  score: z.number().nullable(),
  answers: z.array(answerSchema),
});
export type QuestionnaireOccurrence = z.infer<
  typeof questionnaireOccurrenceSchema
>;

/** The questionnaire placed in a calendar event, to answer or read */
export const questionnaireFormSchema = z.object({
  occurrence: questionnaireOccurrenceSchema,
  questionnaire: questionnaireSchema,
  /** The questions to show: those answered, or the current ones */
  questions: z.array(questionSchema),
  /** The athlete may answer or change their answers now */
  canAnswer: z.boolean(),
  /** The coach who wrote it, null once their account is gone */
  coach: z
    .object({ userId: z.number(), firstName: z.string(), lastName: z.string() })
    .nullable(),
});
export type QuestionnaireForm = z.infer<typeof questionnaireFormSchema>;

export const questionnaireResponsesQuerySchema = z.object({
  athleteId: z.coerce.number().int().positive().optional(),
  questionnaireId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});
export type QuestionnaireResponsesQuery = z.infer<
  typeof questionnaireResponsesQuerySchema
>;

/**
 * Answers over a span: by athlete, by questionnaire, or both. Questions
 * archived since are included when answered in the span.
 */
export const questionnaireResponsesSchema = z.object({
  questionnaires: z.array(questionnaireSchema),
  athletes: z.array(
    z.object({
      athleteId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
  occurrences: z.array(questionnaireOccurrenceSchema),
});
export type QuestionnaireResponses = z.infer<
  typeof questionnaireResponsesSchema
>;

/** The questionnaires waiting for the athlete's answer */
export const pendingQuestionnaireSchema = z.object({
  eventId: z.number(),
  title: z.string(),
  startDate: z.coerce.date(),
  closesAt: z.coerce.date(),
  questionCount: z.number(),
});
export type PendingQuestionnaire = z.infer<typeof pendingQuestionnaireSchema>;
