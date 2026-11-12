import type {
  CreateWorkoutStepDto,
  CreateWorkoutStepTarget,
} from '../../types/dtos/core/workout.dto';
import {
  TRAINING_ZONE_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../types/misc';
import type { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';
import { inferChildType, inferTopLevelType } from './infer';
import {
  type ParsedDuration,
  type Token,
  normalizeQuotes,
  parseDuration,
  parseOnOff,
  parseTarget,
  tokenize,
} from './tokens';
import type {
  WorkoutTextContext,
  WorkoutTextIssue,
  WorkoutTextResult,
  WorkoutTextZone,
} from './types';
import {
  defaultPercentBase,
  fold,
  isBareStepTypeLabel,
  isCyclingSport,
  isSwimmingSport,
  percentBaseMetric,
  stepTypeFromLabel,
} from './vocabulary';

/**
 * Reads a workout written as text into steps.
 *
 * ```
 * - Warmup 15m Z2
 *
 * Main set 5x
 * - 3m Z4
 * - 2m Z1
 *
 * - 10m Z1
 * ```
 *
 * Steps start with "-". A line ending in "5x" repeats the steps under it,
 * up to a blank line, or those indented more than it (repeats then nest).
 * A step can also hold a repeat on one line: "- 6x(400m Z5 / 200m Z1)",
 * "- 10x400m 3:20/km r1'30", "- 3x(10x30/30 Z5) r5'". "r" starts the
 * recovery after an effort; "30/30" is 30 s on, 30 s off. Text after " # "
 * is the step's note. Repeats nested deeper than the devices take are
 * expanded.
 *
 * The grammar is a superset of the common Intervals.icu one: its texts read
 * here, with a plain "m" read as metres from 50 up.
 */

const MAX_REPETITIONS = 99;

interface Node {
  kind: 'step' | 'repeat';
  step: CreateWorkoutStepDto;
  /** Set by a type word in the label, a section or "intensity=" */
  explicitType: WORKOUT_STEP_TYPE | null;
  children: Node[];
  line: number;
  from: number;
  to: number;
}

interface Scope {
  context: WorkoutTextContext;
  issues: WorkoutTextIssue[];
  line: number;
}

function issue(
  scope: Scope,
  severity: WorkoutTextIssue['severity'],
  code: WorkoutTextIssue['code'],
  from: number,
  to: number,
  text?: string,
) {
  scope.issues.push({ severity, code, line: scope.line, from, to, text });
}

const INTENSITY_TYPES: Record<string, WORKOUT_STEP_TYPE> = {
  warmup: WORKOUT_STEP_TYPE.WARMUP,
  cooldown: WORKOUT_STEP_TYPE.COOLDOWN,
  active: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  interval: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  rest: WORKOUT_STEP_TYPE.INTERVAL_REST,
  recovery: WORKOUT_STEP_TYPE.INTERVAL_REST,
  steady: WORKOUT_STEP_TYPE.STEADY,
  free: WORKOUT_STEP_TYPE.FREE,
};

/** Zone type "Z3" alone means for this sport, among those the athlete has */
export function defaultZoneType(
  sport: SPORT_TYPE,
  zones: WorkoutTextZone[] = [],
): TRAINING_ZONE_TYPE {
  const order = isCyclingSport(sport)
    ? [
        TRAINING_ZONE_TYPE.POWER,
        TRAINING_ZONE_TYPE.HEARTRATE,
        TRAINING_ZONE_TYPE.PACE,
      ]
    : isSwimmingSport(sport)
      ? [
          TRAINING_ZONE_TYPE.PACE,
          TRAINING_ZONE_TYPE.HEARTRATE,
          TRAINING_ZONE_TYPE.POWER,
        ]
      : [
          TRAINING_ZONE_TYPE.HEARTRATE,
          TRAINING_ZONE_TYPE.PACE,
          TRAINING_ZONE_TYPE.POWER,
        ];
  return (
    order.find((type) => zones.some((zone) => zone.type === type)) ?? order[0]
  );
}

/** Which target type a percentage of this metric constrains */
function percentTargetType(metric: string): WORKOUT_TARGET_TYPE {
  if (metric === 'HR_MAX') return WORKOUT_TARGET_TYPE.HEARTRATE;
  if (metric === 'VMA') return WORKOUT_TARGET_TYPE.PACE;
  return WORKOUT_TARGET_TYPE.POWER;
}

function newStep(duration: ParsedDuration | null): CreateWorkoutStepDto {
  return {
    stepType: WORKOUT_STEP_TYPE.STEADY,
    name: null,
    durationType: duration?.durationType ?? null,
    durationValue: duration?.durationValue ?? null,
    notes: null,
    targets: [],
  };
}

interface StepDraft {
  node: Node;
  hasDuration: boolean;
  failed: boolean;
}

/**
 * One step line, without its leading "-". It can give several steps:
 * "400m Z5 r1'" is an effort and its recovery, "30/30" too.
 */
function parseStepText(
  text: string,
  offset: number,
  scope: Scope,
  inheritedType: WORKOUT_STEP_TYPE | null,
  /** After a repeat's parentheses, "r5'" needs no effort before it */
  afterRepeat = false,
): Node[] {
  const { sport, zones = [] } = scope.context;
  let body = text;
  let notes: string | null = null;
  const noteAt = body.search(/(^|\s)#/);
  if (noteAt >= 0) {
    notes = body.slice(body.indexOf('#', noteAt) + 1).trim() || null;
    body = body.slice(0, noteAt);
  }

  let label: string | null = null;
  let labelEnd = 0;
  const quoted = body.match(/^\s*"([^"]*)"/);
  if (quoted) {
    label = quoted[1].trim() || null;
    labelEnd = quoted[0].length;
  }
  const tokens = tokenize(body.slice(labelEnd), offset + labelEnd);

  const drafts: StepDraft[] = [];
  const start = (
    duration: ParsedDuration | null,
    type: WORKOUT_STEP_TYPE | null,
    from: number,
  ): StepDraft => {
    const draft: StepDraft = {
      node: {
        kind: 'step',
        step: newStep(duration),
        explicitType: type,
        children: [],
        line: scope.line,
        from,
        to: from,
      },
      hasDuration: !!duration,
      failed: false,
    };
    drafts.push(draft);
    return draft;
  };

  const labelWords: Token[] = [];
  let current: StepDraft | null = null;
  const fail = (
    code: WorkoutTextIssue['code'],
    token: Token,
    draft: StepDraft | null,
  ) => {
    issue(scope, 'error', code, token.from, token.to, token.text);
    if (draft) draft.failed = true;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1]?.word;
    const word = token.word;

    const intensity = word.match(/^intensity=(\w+)$/);
    if (intensity) {
      const type = INTENSITY_TYPES[intensity[1]];
      if (!type) {
        fail('unknown_token', token, current);
        continue;
      }
      (current ?? start(null, null, token.from)).node.explicitType = type;
      continue;
    }

    // "r1'30", "r 200m", "récup 2'": the recovery after the effort
    const restInline = word.match(/^r(.+)$/);
    const canRest = !!current || (afterRepeat && labelWords.length === 0);
    const restDuration =
      restInline && canRest ? parseDuration(restInline[1], sport) : null;
    const restWord =
      canRest &&
      ['r', 'rec', 'recup', 'rest'].includes(word) &&
      next !== undefined
        ? parseDuration(next, sport)
        : null;
    if (restDuration || restWord) {
      current = start(
        restDuration ?? restWord,
        WORKOUT_STEP_TYPE.INTERVAL_REST,
        token.from,
      );
      if (restWord) i += 1;
      current.node.to = tokens[i].to;
      continue;
    }

    const onOff = parseTarget(word, next) ? null : parseOnOff(word, sport);
    if (onOff) {
      if (
        current &&
        (current.hasDuration || current.node.step.targets?.length)
      ) {
        fail('duplicate_duration', token, current);
        continue;
      }
      const effort = current ?? start(null, null, token.from);
      effort.node.step.durationType = onOff[0].durationType;
      effort.node.step.durationValue = onOff[0].durationValue;
      effort.hasDuration = true;
      effort.node.to = token.to;
      current = start(onOff[1], WORKOUT_STEP_TYPE.INTERVAL_REST, token.from);
      current.node.to = token.to;
      continue;
    }

    const duration = parseDuration(word, sport);
    if (duration) {
      if (current?.hasDuration) {
        // A bare number after the duration is a mistake, not a second one
        fail('duplicate_duration', token, current);
        continue;
      }
      current = current ?? start(null, null, token.from);
      current.node.step.durationType = duration.durationType;
      current.node.step.durationValue = duration.durationValue;
      current.hasDuration = true;
      current.node.to = token.to;
      continue;
    }

    const target = parseTarget(word, next);
    if (target) {
      if (target.consumed) i += 1;
      const draft: StepDraft = current ?? start(null, null, token.from);
      current = draft;
      draft.node.to = tokens[i].to;
      const parsed = target.parsed;
      let resolved: CreateWorkoutStepTarget | null = null;
      switch (parsed.kind) {
        case 'none':
          break;
        case 'ramp':
          fail('ramp_unsupported', token, draft);
          break;
        case 'zone_range':
          fail('zone_range', token, draft);
          break;
        case 'zone': {
          const type = parsed.zoneType ?? defaultZoneType(sport, zones);
          const zone = zones.find(
            (z) => z.type === type && z.index === parsed.zone - 1,
          );
          if (!zone) {
            fail('zone_not_found', token, draft);
            break;
          }
          resolved = {
            targetType: WORKOUT_TARGET_TYPE.ZONE,
            targetValue: zone.trainingZoneId,
          };
          break;
        }
        case 'percent': {
          const metric = percentBaseMetric(
            parsed.base ?? defaultPercentBase(sport),
            sport,
          );
          resolved =
            parsed.max === null || parsed.max === parsed.min
              ? {
                  targetType: percentTargetType(metric),
                  targetValue: parsed.min,
                  metricType: metric,
                }
              : {
                  targetType: percentTargetType(metric),
                  targetMin: Math.min(parsed.min, parsed.max),
                  targetMax: Math.max(parsed.min, parsed.max),
                  metricType: metric,
                };
          break;
        }
        case 'target':
          resolved = parsed.target;
          break;
      }
      if (resolved) {
        const values = [
          resolved.targetValue,
          resolved.targetMin,
          resolved.targetMax,
        ];
        if (
          values.some(
            (value) => value !== undefined && value !== null && !(value > 0),
          )
        ) {
          fail('invalid_value', token, draft);
        } else if (
          draft.node.step.targets?.some(
            (other) =>
              other.targetType === resolved?.targetType ||
              (other.targetType === WORKOUT_TARGET_TYPE.ZONE &&
                resolved?.targetType === WORKOUT_TARGET_TYPE.ZONE),
          )
        ) {
          fail('duplicate_target', token, draft);
        } else {
          draft.node.step.targets = [
            ...(draft.node.step.targets ?? []),
            resolved,
          ];
        }
      }
      continue;
    }

    if (current === null && label === null) {
      labelWords.push(token);
      continue;
    }
    fail('unknown_token', token, current);
  }

  if (labelWords.length) {
    label = body
      .slice(
        labelWords[0].from - offset,
        labelWords[labelWords.length - 1].to - offset,
      )
      .trim();
  }

  if (drafts.length === 0) {
    const from = offset;
    const to = offset + body.trimEnd().length;
    issue(
      scope,
      'error',
      'missing_duration',
      from,
      Math.max(to, from + 1),
      text.trim(),
    );
    return [];
  }

  const first = drafts[0];
  if (label) {
    const labelType = stepTypeFromLabel(label);
    first.node.step.name = isBareStepTypeLabel(label) ? null : label;
    first.node.explicitType = first.node.explicitType ?? labelType;
  }
  first.node.explicitType = first.node.explicitType ?? inheritedType;
  if (notes) first.node.step.notes = notes;

  const nodes: Node[] = [];
  for (const draft of drafts) {
    if (draft.failed) continue;
    if (!draft.hasDuration) {
      issue(
        scope,
        'error',
        'missing_duration',
        draft.node.from,
        Math.max(draft.node.to, draft.node.from + 1),
        text.trim(),
      );
      continue;
    }
    if (
      draft.node.step.durationValue !== null &&
      draft.node.step.durationValue !== undefined &&
      !(draft.node.step.durationValue > 0)
    ) {
      issue(scope, 'error', 'invalid_value', draft.node.from, draft.node.to);
      continue;
    }
    nodes.push(draft.node);
  }
  return nodes;
}

/** Splits "a / b, c" at the top level, outside parentheses */
function splitItems(text: string): { text: string; offset: number }[] | null {
  const items: { text: string; offset: number }[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth < 0) return null;
    } else if (depth === 0) {
      const spacedSlash =
        char === '/' &&
        /\s/.test(text[i - 1] ?? '') &&
        /\s/.test(text[i + 1] ?? '');
      // "1,5km" is a decimal, "400m Z5, 200m Z1" two items
      const decimalComma =
        char === ',' &&
        /\d/.test(text[i - 1] ?? '') &&
        /\d/.test(text[i + 1] ?? '');
      if (
        (char === ',' && !decimalComma) ||
        char === ';' ||
        char === '+' ||
        spacedSlash
      ) {
        items.push({ text: text.slice(start, i), offset: start });
        start = i + 1;
      }
    }
  }
  if (depth !== 0) return null;
  items.push({ text: text.slice(start), offset: start });
  return items.filter((item) => item.text.trim().length > 0);
}

function matchingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const INLINE_REPEAT = /^(\s*)(?:(.*?)\s+)?(\d+)\s*[x×]\s*(?=\S)/i;

function repeatNode(
  repetitions: number,
  name: string | null,
  scope: Scope,
  from: number,
  to: number,
): Node {
  if (repetitions < 1 || repetitions > MAX_REPETITIONS) {
    issue(scope, 'error', 'repetitions_range', from, to);
  }
  return {
    kind: 'repeat',
    step: {
      stepType: WORKOUT_STEP_TYPE.REPEAT,
      name,
      durationType: WORKOUT_DURATION_TYPE.OPEN,
      durationValue: null,
      notes: null,
      targets: [],
      repeatBlock: { repetitions, childSteps: [] },
    },
    explicitType: null,
    children: [],
    line: scope.line,
    from,
    to,
  };
}

/** A sequence of items on one line, repeats and steps */
function parseSequence(
  text: string,
  offset: number,
  scope: Scope,
  inheritedType: WORKOUT_STEP_TYPE | null,
): Node[] {
  // The note runs to the end of the line, commas and all: it goes to the
  // first step the line gives
  const noteAt = text.search(/(^|\s)#/);
  const body = noteAt >= 0 ? text.slice(0, noteAt) : text;
  const notes =
    noteAt >= 0 ? text.slice(text.indexOf('#', noteAt) + 1).trim() : '';
  const items = splitItems(body);
  if (!items) {
    issue(scope, 'error', 'unclosed_paren', offset, offset + body.length);
    return [];
  }
  const nodes = items.flatMap((item) =>
    parseItem(item.text, offset + item.offset, scope, inheritedType),
  );
  if (notes && nodes[0]) nodes[0].step.notes = notes;
  return nodes;
}

function parseItem(
  text: string,
  offset: number,
  scope: Scope,
  inheritedType: WORKOUT_STEP_TYPE | null,
): Node[] {
  const repeat = text.match(INLINE_REPEAT);
  // "Série 2x" without anything after is a label, "6x400" a repeat
  if (repeat && !(repeat[2] && /\d$/.test(repeat[2]))) {
    const head = repeat[0].length;
    const rest = text.slice(head);
    const repetitions = Number(repeat[3]);
    const name = repeat[2]?.trim()
      ? normalizeQuotes(repeat[2].trim()).replace(/^"|"$/g, '') || null
      : null;
    const node = repeatNode(
      repetitions,
      name,
      scope,
      offset + repeat[1].length,
      offset + head,
    );
    if (rest.trimStart().startsWith('(')) {
      const open = text.indexOf('(', head);
      const close = matchingParen(text, open);
      if (close < 0) {
        issue(
          scope,
          'error',
          'unclosed_paren',
          offset + open,
          offset + text.length,
        );
        return [];
      }
      node.children = parseSequence(
        text.slice(open + 1, close),
        offset + open + 1,
        scope,
        null,
      );
      node.to = offset + close + 1;
      const trailing = text.slice(close + 1);
      // "3x(...) r5'": the recovery after the whole repeat
      const after = trailing.trim()
        ? parseStepText(trailing, offset + close + 1, scope, null, true)
        : [];
      return [node, ...after];
    }
    node.children = parseStepText(rest, offset + head, scope, null);
    node.to = offset + text.trimEnd().length;
    return [node];
  }
  return parseStepText(text, offset, scope, inheritedType);
}

interface Line {
  index: number;
  indent: number;
  text: string;
  /** Column where `text` starts */
  start: number;
}

type LineKind =
  | { kind: 'blank' }
  | { kind: 'comment' }
  | { kind: 'step'; content: string; offset: number }
  | { kind: 'header'; repetitions: number; name: string | null }
  | { kind: 'section'; type: WORKOUT_STEP_TYPE | null }
  | { kind: 'loose'; content: string; offset: number };

const BLOCK_HEADER = /^(?:(.*?)\s+)?(\d+)\s*[x×]$/i;

function classify(line: Line, sport: SPORT_TYPE): LineKind {
  const text = line.text;
  if (!text) return { kind: 'blank' };
  if (text.startsWith('//') || /^#+(\s|$)/.test(text))
    return { kind: 'comment' };
  const bullet = text.match(/^[-*•–]\s*/);
  if (bullet) {
    return {
      kind: 'step',
      content: text.slice(bullet[0].length),
      offset: line.start + bullet[0].length,
    };
  }
  const header = text.match(BLOCK_HEADER);
  if (header) {
    const name = header[1]?.trim() ? normalizeQuotes(header[1].trim()) : null;
    return { kind: 'header', repetitions: Number(header[2]), name };
  }
  if (INLINE_REPEAT.test(text) && text.includes('(')) {
    return { kind: 'loose', content: text, offset: line.start };
  }
  const plain = text.replace(/:$/, '');
  if (isBareStepTypeLabel(plain)) {
    return { kind: 'section', type: stepTypeFromLabel(plain) };
  }
  // A step written without its dash still reads as one
  const words = tokenize(text).map((token) => token.word);
  if (words.some((word) => parseDuration(word, sport) && !/^\d+$/.test(word))) {
    return { kind: 'loose', content: text, offset: line.start };
  }
  return { kind: 'section', type: null };
}

function parseLines(
  text: string,
  context: WorkoutTextContext,
  issues: WorkoutTextIssue[],
): Node[] {
  const lines: Line[] = text.split(/\r?\n/).map((raw, index) => {
    const expanded = raw.replace(/\t/g, '  ');
    const indent = expanded.length - expanded.trimStart().length;
    return {
      index,
      indent,
      text: expanded.trim(),
      start: indent,
    };
  });
  const kinds = lines.map((line) => classify(line, context.sport));
  let position = 0;

  const scopeFor = (line: Line): Scope => ({
    context,
    issues,
    line: line.index,
  });

  /**
   * Items at an indentation above `minIndent`. `untilBlank` closes an
   * unindented repeat at the first blank line, as Intervals.icu does.
   */
  const block = (
    minIndent: number,
    untilBlank: boolean,
    stepsOnly: boolean,
  ): Node[] => {
    const nodes: Node[] = [];
    let section: WORKOUT_STEP_TYPE | null = null;
    while (position < lines.length) {
      const line = lines[position];
      const kind = kinds[position];
      if (kind.kind === 'blank') {
        if (untilBlank) return nodes;
        section = null;
        position += 1;
        continue;
      }
      if (kind.kind === 'comment') {
        position += 1;
        continue;
      }
      if (line.indent < minIndent) return nodes;
      if (stepsOnly && kind.kind !== 'step') return nodes;
      const scope = scopeFor(line);
      switch (kind.kind) {
        case 'step':
        case 'loose':
          position += 1;
          nodes.push(
            ...parseSequence(kind.content, kind.offset, scope, section),
          );
          break;
        case 'section':
          position += 1;
          if (kind.type === null) {
            // A free title ("Main set") says nothing the steps keep
            issue(
              scope,
              'warning',
              'ignored_line',
              line.start,
              line.start + line.text.length,
              line.text,
            );
          }
          section = kind.type;
          break;
        case 'header': {
          position += 1;
          const node = repeatNode(
            kind.repetitions,
            kind.name,
            scope,
            line.start,
            line.start + line.text.length,
          );
          // Children indented under it, or the steps that follow up to a blank line
          let next = position;
          while (next < lines.length && kinds[next].kind === 'comment')
            next += 1;
          const indented =
            next < lines.length &&
            kinds[next].kind !== 'blank' &&
            lines[next].indent > line.indent;
          node.children = indented
            ? block(lines[next].indent, false, false)
            : block(line.indent, true, true);
          if (node.children.length === 0) {
            issue(
              scope,
              'error',
              'empty_repeat',
              line.start,
              line.start + line.text.length,
            );
            break;
          }
          nodes.push(node);
          break;
        }
      }
    }
    return nodes;
  };

  const nodes: Node[] = [];
  while (position < lines.length) {
    const before = position;
    nodes.push(...block(0, false, false));
    // An indented line at the top: read it as if it were not
    if (position === before) {
      lines[position].indent = 0;
    }
  }
  return nodes;
}

/**
 * Repeats inside repeats, which watches do not take: a repeat around a
 * single repeat multiplies, any other is written out.
 */
function flatten(
  nodes: Node[],
  depth: number,
  scope: Omit<Scope, 'line'>,
): Node[] {
  return nodes.flatMap((node) => {
    if (node.kind !== 'repeat') return [node];
    const children = flatten(node.children, depth + 1, scope);
    const nested = children.some((child) => child.kind === 'repeat');
    if (!nested) return [{ ...node, children }];
    const repetitions = node.step.repeatBlock?.repetitions ?? 1;
    scope.issues.push({
      severity: 'warning',
      code: 'nested_repeat_expanded',
      line: node.line,
      from: node.from,
      to: node.to,
    });
    if (children.length === 1) {
      const inner = children[0];
      const product = repetitions * (inner.step.repeatBlock?.repetitions ?? 1);
      if (product <= MAX_REPETITIONS) {
        return [
          {
            ...inner,
            step: {
              ...inner.step,
              name: inner.step.name ?? node.step.name,
              repeatBlock: { repetitions: product, childSteps: [] },
            },
          },
        ];
      }
    }
    // Steps leaving the repeat keep the type they had in it
    const shapes = children.map((child) => child.step);
    const typed = children.map((child, index) =>
      child.kind === 'step' && child.explicitType === null
        ? {
            ...child,
            explicitType: inferChildType(
              child.step,
              index,
              shapes,
              scope.context.zones ?? [],
            ),
          }
        : child,
    );
    const copies: Node[] = [];
    for (let i = 0; i < repetitions; i += 1) copies.push(...typed);
    return copies;
  });
}

function build(
  nodes: Node[],
  zones: WorkoutTextZone[],
  parent: 'top' | 'repeat',
  fixedType?: WORKOUT_STEP_TYPE,
): CreateWorkoutStepDto[] {
  const shapes = nodes.map((node) =>
    node.kind === 'repeat'
      ? {
          ...node.step,
          repeatBlock: {
            repetitions: node.step.repeatBlock?.repetitions ?? 1,
            childSteps: build(node.children, zones, 'repeat'),
          },
        }
      : { ...node.step },
  );
  return shapes.map((step, index) => {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) return step;
    const explicit = nodes[index].explicitType;
    const stepType =
      explicit ??
      (parent === 'top' ? fixedType : undefined) ??
      (parent === 'repeat'
        ? inferChildType(step, index, shapes, zones)
        : inferTopLevelType(index, shapes));
    return { ...step, stepType };
  });
}

export function parseWorkoutText(
  text: string,
  context: WorkoutTextContext,
): WorkoutTextResult {
  const issues: WorkoutTextIssue[] = [];
  const nodes = parseLines(text, context, issues);
  const flat = flatten(nodes, 0, { context, issues });
  const steps = build(flat, context.zones ?? [], 'top', context.stepType);
  issues.sort((a, b) => a.line - b.line || a.from - b.from);
  return { steps, issues };
}

/** Whether a word, typed as a step label, would be read as something else */
export function isReservedWord(word: string, sport: SPORT_TYPE): boolean {
  const folded = fold(normalizeQuotes(word));
  return (
    !!parseDuration(folded, sport) ||
    !!parseTarget(folded, undefined) ||
    !!parseOnOff(folded, sport) ||
    /^intensity=/.test(folded) ||
    /^\d+\s*[x×]$/.test(folded) ||
    (/^r.+/.test(folded) && !!parseDuration(folded.slice(1), sport))
  );
}
