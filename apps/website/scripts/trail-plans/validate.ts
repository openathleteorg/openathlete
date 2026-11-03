/**
 * Parses every plan file with seoPlanDataSchema, the schema the API applies
 * on import, and checks what the schema cannot: the week count matches the
 * plan length, and relative targets stay fractions of the athlete's metric.
 *
 *   npx tsx scripts/trail-plans/validate.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  type CreateWorkoutStepDto,
  seoPlanDataSchema,
} from '@openathlete/shared';

const PLANS_DIR = join(process.cwd(), 'src/lib/training-plans/plans');

function* steps(list: CreateWorkoutStepDto[]): Generator<CreateWorkoutStepDto> {
  for (const step of list) {
    yield step;
    if (step.repeatBlock) yield* steps(step.repeatBlock.childSteps);
  }
}

const errors: string[] = [];
let count = 0;

for (const sport of readdirSync(PLANS_DIR)) {
  for (const file of readdirSync(join(PLANS_DIR, sport))) {
    if (!file.endsWith('.json')) continue;
    const name = `${sport}/${file}`;
    count++;
    const parsed = seoPlanDataSchema.safeParse(
      JSON.parse(readFileSync(join(PLANS_DIR, sport, file), 'utf-8')),
    );
    if (!parsed.success) {
      errors.push(`${name}: ${parsed.error.message}`);
      continue;
    }
    const { plan, cycles } = parsed.data;
    const weeks = cycles.flatMap((cycle) => cycle.weeks);
    if (weeks.length !== plan.duration) {
      errors.push(
        `${name}: ${weeks.length} weeks for a ${plan.duration}-week plan`,
      );
    }
    weeks.forEach((week, index) => {
      if (week.weekNumber !== index + 1) {
        errors.push(
          `${name}: week ${index + 1} is numbered ${week.weekNumber}`,
        );
      }
      for (const session of week.sessions) {
        for (const step of steps(session.workout?.steps ?? [])) {
          for (const target of step.targets ?? []) {
            if (!target.metricType) continue;
            for (const value of [
              target.targetMin,
              target.targetMax,
              target.targetValue,
            ]) {
              if (value != null && (value <= 0 || value > 1.2)) {
                errors.push(
                  `${name}: week ${week.weekNumber} "${session.name}" has ${value} of ${target.metricType}`,
                );
              }
            }
          }
        }
      }
    });
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
process.stdout.write(`${count} plan files valid\n`);
