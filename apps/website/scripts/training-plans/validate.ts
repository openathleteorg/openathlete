/**
 * Checks every plan file the way the website and the API read it:
 *   pnpm exec tsx scripts/training-plans/validate.ts
 *
 * - `seoPlanDataSchema`, as the plan pages and `POST /seo-plan` do;
 * - `createWorkoutSchema` on each session, as `TrainingPlanService.importSeoPlan`
 *   does before saving a workout (it drops the workout silently otherwise);
 * - targets: every effort step has one, VMA shares are fractions, absolute
 *   paces are m/s and convert to sensible paces with `getTargetIntensity`;
 * - weeks numbered 1..duration, and every plan in every language.
 */
/* eslint-disable no-console -- command-line report */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  type CreateWorkoutStepDto,
  WORKOUT_STEP_TYPE,
  createWorkoutSchema,
  getTargetIntensity,
  seoPlanDataSchema,
} from '@openathlete/shared';

import { RUNNING_PLAN_SPECS } from '../../src/lib/training-plans/specs';
import { PLANS_DIR, planFileName } from './generate';
import { PLAN_LOCALES } from './texts';

const errors: string[] = [];
const fail = (file: string, message: string) =>
  errors.push(`${file}: ${message}`);

/** Steps without a target on purpose: recoveries, strides, repeat headers. */
const UNTARGETED = new Set<string>([
  WORKOUT_STEP_TYPE.REPEAT,
  WORKOUT_STEP_TYPE.INTERVAL_REST,
]);

function checkStep(file: string, where: string, step: CreateWorkoutStepDto) {
  const children = step.repeatBlock?.childSteps ?? [];
  children.forEach((child, i) => checkStep(file, `${where}.${i}`, child));
  const stride = step.durationType === 'TIME' && step.durationValue === 20;
  if (
    !UNTARGETED.has(step.stepType) &&
    !stride &&
    (step.targets ?? []).length === 0
  ) {
    fail(file, `${where} (${step.name}) has no target`);
  }
  if (!step.durationValue && step.stepType !== WORKOUT_STEP_TYPE.REPEAT) {
    fail(file, `${where} (${step.name}) has no duration`);
  }
  for (const target of step.targets ?? []) {
    if (target.targetType !== 'PACE') {
      fail(file, `${where}: unexpected ${target.targetType} target`);
      continue;
    }
    const min = target.targetMin ?? NaN;
    const max = target.targetMax ?? NaN;
    if (!(min < max))
      fail(file, `${where}: targetMin ${min} is not below targetMax ${max}`);
    if (target.metricType === 'VMA') {
      if (min < 0.5 || max > 1.1)
        fail(file, `${where}: VMA share ${min}-${max} out of range`);
    } else if (target.metricType == null) {
      // Values up to 2 would be read as a share of VMA by getTargetIntensity
      if (min <= 2)
        fail(file, `${where}: absolute pace ${min} m/s reads as a percentage`);
    } else {
      fail(file, `${where}: unexpected metric ${target.metricType}`);
    }
    // An athlete with a 14 km/h VMA: every target must be a running pace
    const speed = getTargetIntensity(target, { VMA: 14 });
    for (const value of [speed.min, speed.max]) {
      const pace = value ? 1000 / value : NaN;
      if (!(pace > 150 && pace < 600)) {
        fail(file, `${where}: ${value} m/s is not a running pace`);
      }
    }
  }
}

const files = readdirSync(PLANS_DIR).filter((f) => f.endsWith('.json'));
for (const spec of RUNNING_PLAN_SPECS) {
  for (const locale of PLAN_LOCALES) {
    const name = planFileName(spec, locale);
    if (!files.includes(name)) fail(name, 'missing');
  }
}

let sessions = 0;
for (const file of files) {
  const raw = JSON.parse(readFileSync(join(PLANS_DIR, file), 'utf-8'));
  const parsed = seoPlanDataSchema.safeParse(raw);
  if (!parsed.success) {
    fail(file, parsed.error.message);
    continue;
  }
  const plan = parsed.data;
  const weeks = plan.cycles.flatMap((c) => c.weeks);
  if (weeks.length !== plan.plan.duration) {
    fail(file, `${weeks.length} weeks for a duration of ${plan.plan.duration}`);
  }
  weeks.forEach((week, i) => {
    if (week.weekNumber !== i + 1)
      fail(file, `week ${i + 1} is numbered ${week.weekNumber}`);
    const days = week.sessions.map((s) => s.dayOfWeek);
    if (new Set(days).size !== days.length)
      fail(file, `week ${week.weekNumber} has two sessions on one day`);
    week.sessions.forEach((session, j) => {
      sessions += 1;
      const where = `W${week.weekNumber} #${j}`;
      if (!session.goalDistance || !session.goalDuration)
        fail(file, `${where} has no distance or duration`);
      if (
        session.goalRpe == null ||
        session.goalRpe < 1 ||
        session.goalRpe > 10
      ) {
        fail(file, `${where} RPE ${session.goalRpe}`);
      }
      const workout = createWorkoutSchema.safeParse({
        steps: session.workout?.steps ?? [],
      });
      if (!workout.success) {
        fail(
          file,
          `${where} workout rejected by the API: ${workout.error.message}`,
        );
        return;
      }
      if (workout.data.steps.length === 0)
        fail(file, `${where} has no workout`);
      workout.data.steps.forEach((step, k) =>
        checkStep(file, `${where} step ${k}`, step),
      );
    });
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`${files.length} files, ${sessions} sessions: all valid.`);
