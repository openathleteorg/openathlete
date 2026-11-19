import { m } from '@/paraglide/messages';

import {
  METRIC_TYPE,
  QUESTIONNAIRE_SCORE,
  QUESTION_TYPE,
  type QuestionnaireInputDraft,
} from '@openathlete/shared';

export const QUESTIONNAIRE_TEMPLATES = [
  'hooper',
  'mclean',
  'weekly',
  'tqr',
  'blank',
] as const;
export type QuestionnaireTemplate = (typeof QUESTIONNAIRE_TEMPLATES)[number];

export const isQuestionnaireTemplate = (
  value: string | null,
): value is QuestionnaireTemplate =>
  (QUESTIONNAIRE_TEMPLATES as readonly string[]).includes(value ?? '');

/** What the gallery says of each template */
export const templateInfo = (template: QuestionnaireTemplate) =>
  ({
    hooper: {
      title: m.questionnaire_template_hooper(),
      description: m.questionnaire_template_hooper_description(),
      source: 'Hooper & Mackinnon, 1995',
    },
    mclean: {
      title: m.questionnaire_template_mclean(),
      description: m.questionnaire_template_mclean_description(),
      source: 'McLean et al., 2010',
    },
    weekly: {
      title: m.questionnaire_template_weekly(),
      description: m.questionnaire_template_weekly_description(),
      source: undefined,
    },
    tqr: {
      title: m.questionnaire_template_tqr(),
      description: m.questionnaire_template_tqr_description(),
      source: 'Kenttä & Hassmén, 1998',
    },
    blank: {
      title: m.questionnaire_template_blank(),
      description: m.questionnaire_template_blank_description(),
      source: undefined,
    },
  })[template];

const scale = (
  label: string,
  config: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
    display?: 'BUTTONS' | 'SLIDER';
  },
  extra: { inScore?: boolean; help?: string } = {},
) => ({
  type: QUESTION_TYPE.SCALE as const,
  label,
  required: true,
  ...extra,
  config: { step: 1 as const, display: 'BUTTONS' as const, ...config },
});

/**
 * The questionnaire a template starts from, in the coach's language. The
 * wording is ours: the published scales give the items and their anchors.
 */
export function templateQuestionnaire(
  template: QuestionnaireTemplate,
): QuestionnaireInputDraft {
  switch (template) {
    // Each item from 1 (very, very good) to 7 (very, very bad): the lower
    // the sum, the better the athlete copes with the training
    case 'hooper': {
      const ends = {
        min: 1,
        max: 7,
        minLabel: m.questionnaire_hooper_low(),
        maxLabel: m.questionnaire_hooper_high(),
      };
      return {
        title: m.questionnaire_template_hooper(),
        description: m.questionnaire_hooper_intro(),
        scoreKind: QUESTIONNAIRE_SCORE.SUM,
        scoreMetricType: METRIC_TYPE.HOOPER_INDEX,
        questions: [
          scale(m.questionnaire_item_fatigue(), ends, { inScore: true }),
          scale(m.questionnaire_item_stress(), ends, { inScore: true }),
          scale(m.questionnaire_item_soreness(), ends, { inScore: true }),
          scale(
            m.questionnaire_item_sleep_quality(),
            {
              ...ends,
              minLabel: m.questionnaire_hooper_sleep_good(),
              maxLabel: m.questionnaire_hooper_sleep_bad(),
            },
            { inScore: true },
          ),
        ],
      };
    }
    // Each item from 1 (worst) to 5 (best): the higher the sum, the better
    case 'mclean': {
      const item = (label: string, minLabel: string, maxLabel: string) =>
        scale(label, { min: 1, max: 5, minLabel, maxLabel }, { inScore: true });
      return {
        title: m.questionnaire_template_mclean(),
        description: m.questionnaire_mclean_intro(),
        scoreKind: QUESTIONNAIRE_SCORE.SUM,
        scoreMetricType: null,
        questions: [
          item(
            m.questionnaire_item_fatigue(),
            m.questionnaire_mclean_fatigue_low(),
            m.questionnaire_mclean_fatigue_high(),
          ),
          item(
            m.questionnaire_item_sleep_quality(),
            m.questionnaire_mclean_sleep_low(),
            m.questionnaire_mclean_sleep_high(),
          ),
          item(
            m.questionnaire_item_soreness(),
            m.questionnaire_mclean_soreness_low(),
            m.questionnaire_mclean_soreness_high(),
          ),
          item(
            m.questionnaire_item_stress(),
            m.questionnaire_mclean_stress_low(),
            m.questionnaire_mclean_stress_high(),
          ),
          item(
            m.questionnaire_item_mood(),
            m.questionnaire_mclean_mood_low(),
            m.questionnaire_mclean_mood_high(),
          ),
        ],
      };
    }
    case 'weekly': {
      const outOfTen = (label: string, minLabel: string, maxLabel: string) =>
        scale(label, { min: 1, max: 10, minLabel, maxLabel });
      return {
        title: m.questionnaire_template_weekly(),
        description: m.questionnaire_weekly_intro(),
        scoreKind: QUESTIONNAIRE_SCORE.NONE,
        scoreMetricType: null,
        questions: [
          outOfTen(
            m.questionnaire_weekly_feeling(),
            m.questionnaire_weekly_feeling_low(),
            m.questionnaire_weekly_feeling_high(),
          ),
          outOfTen(
            m.questionnaire_weekly_load(),
            m.questionnaire_weekly_load_low(),
            m.questionnaire_weekly_load_high(),
          ),
          outOfTen(
            m.questionnaire_weekly_motivation(),
            m.questionnaire_weekly_motivation_low(),
            m.questionnaire_weekly_motivation_high(),
          ),
          {
            type: QUESTION_TYPE.YES_NO,
            label: m.questionnaire_weekly_pain(),
            required: true,
          },
          {
            type: QUESTION_TYPE.LONG_TEXT,
            label: m.questionnaire_weekly_went_well(),
            required: false,
          },
          {
            type: QUESTION_TYPE.LONG_TEXT,
            label: m.questionnaire_weekly_was_hard(),
            required: false,
          },
          {
            type: QUESTION_TYPE.LONG_TEXT,
            label: m.questionnaire_weekly_availability(),
            required: false,
          },
        ],
      };
    }
    // One question on the Borg 6-20 range, before a key session
    case 'tqr':
      return {
        title: m.questionnaire_template_tqr(),
        description: m.questionnaire_tqr_intro(),
        scoreKind: QUESTIONNAIRE_SCORE.NONE,
        scoreMetricType: null,
        questions: [
          scale(m.questionnaire_tqr_question(), {
            min: 6,
            max: 20,
            minLabel: m.questionnaire_tqr_low(),
            maxLabel: m.questionnaire_tqr_high(),
            display: 'SLIDER',
          }),
        ],
      };
    case 'blank':
      return {
        title: '',
        description: '',
        scoreKind: QUESTIONNAIRE_SCORE.NONE,
        scoreMetricType: null,
        questions: [
          {
            type: QUESTION_TYPE.SCALE,
            label: m.questionnaire_blank_question(),
            required: true,
            config: { min: 1, max: 10, step: 1, display: 'BUTTONS' },
          },
        ],
      };
  }
}
