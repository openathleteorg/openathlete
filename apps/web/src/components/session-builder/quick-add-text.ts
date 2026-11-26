import type { CreateWorkoutStepDto, UnitSystem } from '@openathlete/shared';

import { formatStepLength } from './step-summary';
import type { BuilderEnv } from './use-builder-env';

/** What a piece of text adds, in a few words: "6 × (1 km · 2')" */
export function describeSteps(
  steps: CreateWorkoutStepDto[],
  unitSystem: UnitSystem = 'METRIC',
): string {
  return steps
    .map((step) => {
      if (step.repeatBlock) {
        const inner = step.repeatBlock.childSteps
          .map((child) => formatStepLength(child, unitSystem) ?? '…')
          .join(' · ');
        return `${step.repeatBlock.repetitions} × (${inner})`;
      }
      return formatStepLength(step, unitSystem) ?? '…';
    })
    .join('  +  ');
}

/** Typed shorthands that show what the text can do, by sport */
export function quickExamples(env: BuilderEnv): string[] {
  const imperial = env.unitSystem === 'IMPERIAL';
  switch (env.sport) {
    case 'CYCLING':
    case 'VIRTUAL_RIDE':
    case 'GRAVEL_RIDE':
      return [
        "15' Z2",
        "3x(10' 95% / 5' Z1)",
        '8x(30" 120% / 30" Z1)',
        "10' Z1",
      ];
    case 'SWIMMING':
      return imperial
        ? ['400yd Z1', '8x(100yd Z4 / 20s)', '4x(50yd Z5 / 30s)', '200yd Z1']
        : ['400m Z1', '8x(100m Z4 / 20s)', '4x(50m Z5 / 30s)', '200m Z1'];
    default:
      return [
        "15' Z2",
        imperial ? "6x(1mi Z4 / 2' Z1)" : "6x(1km Z4 / 2' Z1)",
        '10x30/30 Z5',
        "3x(10' Z3) r2'",
        "10' Z1",
      ];
  }
}
