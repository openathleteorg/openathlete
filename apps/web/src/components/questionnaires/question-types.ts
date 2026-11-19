import { m } from '@/paraglide/messages';
import {
  AlignLeft,
  CheckSquare,
  CircleDot,
  Hash,
  type LucideIcon,
  SlidersHorizontal,
  ToggleLeft,
  Type,
} from 'lucide-react';

import {
  QUESTION_TYPE,
  type QuestionInputDraft,
  type Questionnaire,
  type QuestionnaireInputDraft,
  type ScaleConfig,
} from '@openathlete/shared';

export const QUESTION_TYPES = [
  QUESTION_TYPE.SCALE,
  QUESTION_TYPE.NUMBER,
  QUESTION_TYPE.YES_NO,
  QUESTION_TYPE.SINGLE_CHOICE,
  QUESTION_TYPE.MULTIPLE_CHOICE,
  QUESTION_TYPE.SHORT_TEXT,
  QUESTION_TYPE.LONG_TEXT,
] as const;

export const questionTypeLabel = (type: QUESTION_TYPE): string =>
  ({
    [QUESTION_TYPE.SCALE]: m.question_type_scale(),
    [QUESTION_TYPE.NUMBER]: m.question_type_number(),
    [QUESTION_TYPE.YES_NO]: m.question_type_yes_no(),
    [QUESTION_TYPE.SINGLE_CHOICE]: m.question_type_single_choice(),
    [QUESTION_TYPE.MULTIPLE_CHOICE]: m.question_type_multiple_choice(),
    [QUESTION_TYPE.SHORT_TEXT]: m.question_type_short_text(),
    [QUESTION_TYPE.LONG_TEXT]: m.question_type_long_text(),
  })[type];

export const questionTypeIcon: Record<QUESTION_TYPE, LucideIcon> = {
  [QUESTION_TYPE.SCALE]: SlidersHorizontal,
  [QUESTION_TYPE.NUMBER]: Hash,
  [QUESTION_TYPE.YES_NO]: ToggleLeft,
  [QUESTION_TYPE.SINGLE_CHOICE]: CircleDot,
  [QUESTION_TYPE.MULTIPLE_CHOICE]: CheckSquare,
  [QUESTION_TYPE.SHORT_TEXT]: Type,
  [QUESTION_TYPE.LONG_TEXT]: AlignLeft,
};

/** The scales coaches use most, one click away */
export const SCALE_PRESETS: Pick<ScaleConfig, 'min' | 'max'>[] = [
  { min: 1, max: 5 },
  { min: 1, max: 7 },
  { min: 1, max: 10 },
  { min: 0, max: 10 },
  { min: 1, max: 20 },
  { min: 0, max: 100 },
];

/** A stable id for a new option: answers keep it when the label changes */
export const newOptionId = () => `o${Math.random().toString(36).slice(2, 10)}`;

/** A new question of a type, ready to be written */
export function newQuestion(type: QUESTION_TYPE): QuestionInputDraft {
  const base = { label: '', help: '', required: true };
  switch (type) {
    case QUESTION_TYPE.SCALE:
      return {
        ...base,
        type,
        config: {
          min: 1,
          max: 10,
          step: 1,
          minLabel: '',
          maxLabel: '',
          display: 'BUTTONS',
        },
      };
    case QUESTION_TYPE.NUMBER:
      return {
        ...base,
        type,
        config: { unit: '', min: null, max: null, decimals: 1 },
      };
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE:
      return {
        ...base,
        type,
        config: {
          options: [
            { id: newOptionId(), label: '' },
            { id: newOptionId(), label: '' },
          ],
        },
      };
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT:
    case QUESTION_TYPE.YES_NO:
      return { ...base, type, config: {} };
  }
}

/** The stored questionnaire, in the shape the form edits */
export function toDraft(questionnaire: Questionnaire): QuestionnaireInputDraft {
  return {
    title: questionnaire.title,
    description: questionnaire.description,
    scoreKind: questionnaire.scoreKind,
    scoreMetricType:
      questionnaire.scoreMetricType as QuestionnaireInputDraft['scoreMetricType'],
    questions: questionnaire.questions.map(
      ({ position: _position, archivedAt: _archivedAt, ...question }) =>
        question as QuestionnaireInputDraft['questions'][number],
    ),
  };
}
