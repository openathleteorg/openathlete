/**
 * Example Test for validate-plan Tool
 *
 * This demonstrates how to use the validate-plan tool and what to expect
 * from different validation scenarios.
 *
 * NOTE: This is for documentation purposes. Actual tests should be in a proper test file.
 */
import { validatePlanTool } from './validate-plan.tool';

// ============================================================================
// Example 1: Valid Plan (Should Pass)
// ============================================================================

const validPlan = {
  plan: {
    name: 'Marathon Training - Spring 2025',
    goal: 'Sub-3:30 marathon',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-05-01T00:00:00Z',
    cycles: [
      {
        name: 'Base Building',
        phase: 'BASE' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-02-28T00:00:00Z',
        weeks: [
          {
            weekNumber: 1,
            startDate: '2025-01-01T00:00:00Z',
            endDate: '2025-01-07T00:00:00Z',
            theme: 'Easy base building',
            targetVolume: 18000, // 5 hours
            sessions: [
              {
                startDate: '2025-01-02T06:00:00Z',
                endDate: '2025-01-02T07:00:00Z',
                sport: 'running',
                goalDuration: 3600,
                goalDistance: 10000,
                goalRpe: 0.4, // Easy
                description: 'Easy run',
              },
              {
                startDate: '2025-01-04T06:00:00Z',
                endDate: '2025-01-04T07:00:00Z',
                sport: 'running',
                goalDuration: 3600,
                goalDistance: 10000,
                goalRpe: 0.4,
                description: 'Easy run',
              },
              {
                startDate: '2025-01-06T07:00:00Z',
                endDate: '2025-01-06T09:30:00Z',
                sport: 'running',
                goalDuration: 9000,
                goalDistance: 22000,
                goalRpe: 0.5,
                description: 'Long run',
              },
            ],
          },
          {
            weekNumber: 2,
            startDate: '2025-01-08T00:00:00Z',
            endDate: '2025-01-14T00:00:00Z',
            theme: 'Base building with progression',
            targetVolume: 19800, // +10% from week 1
            sessions: [
              {
                startDate: '2025-01-09T06:00:00Z',
                endDate: '2025-01-09T07:00:00Z',
                sport: 'running',
                goalDuration: 3600,
                goalRpe: 0.4,
                description: 'Easy run',
              },
              {
                startDate: '2025-01-11T06:00:00Z',
                endDate: '2025-01-11T07:30:00Z',
                sport: 'running',
                goalDuration: 5400,
                goalRpe: 0.4,
                description: 'Easy run',
              },
              {
                startDate: '2025-01-13T07:00:00Z',
                endDate: '2025-01-13T10:00:00Z',
                sport: 'running',
                goalDuration: 10800,
                goalDistance: 25000,
                goalRpe: 0.5,
                description: 'Long run',
              },
            ],
          },
        ],
      },
    ],
  },
};

// Expected result: valid=true, score ~95-100, no critical errors

// ============================================================================
// Example 2: Plan with Load Spike (Should Fail)
// ============================================================================

const planWithLoadSpike = {
  plan: {
    name: 'Dangerous Plan',
    goal: 'Marathon',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-03-01T00:00:00Z',
    cycles: [
      {
        name: 'Too aggressive',
        phase: 'BASE' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-02-28T00:00:00Z',
        weeks: [
          {
            weekNumber: 1,
            startDate: '2025-01-01T00:00:00Z',
            endDate: '2025-01-07T00:00:00Z',
            targetVolume: 18000, // 5 hours
            sessions: [
              {
                startDate: '2025-01-02T06:00:00Z',
                endDate: '2025-01-02T07:00:00Z',
                sport: 'running',
                goalDuration: 18000,
                goalRpe: 0.4,
                description: 'Easy run',
              },
            ],
          },
          {
            weekNumber: 2,
            startDate: '2025-01-08T00:00:00Z',
            endDate: '2025-01-14T00:00:00Z',
            targetVolume: 28800, // +60% increase - CRITICAL ERROR!
            sessions: [
              {
                startDate: '2025-01-09T06:00:00Z',
                endDate: '2025-01-09T07:00:00Z',
                sport: 'running',
                goalDuration: 28800,
                goalRpe: 0.4,
                description: 'Very long run',
              },
            ],
          },
        ],
      },
    ],
  },
};

// Expected result:
// valid=false
// score ~80 (100 - 20 for CRITICAL)
// errors: [{ type: 'LOAD_SPIKE', severity: 'CRITICAL', ... }]

// ============================================================================
// Example 3: Plan with Consecutive Hard Sessions (Should Fail)
// ============================================================================

const planWithConsecutiveHard = {
  plan: {
    name: 'Too Much Too Soon',
    goal: 'Marathon',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-02-01T00:00:00Z',
    cycles: [
      {
        name: 'Intense week',
        phase: 'SPECIFIC' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T00:00:00Z',
        weeks: [
          {
            weekNumber: 1,
            startDate: '2025-01-01T00:00:00Z',
            endDate: '2025-01-07T00:00:00Z',
            targetVolume: 21600,
            sessions: [
              {
                startDate: '2025-01-02T06:00:00Z',
                endDate: '2025-01-02T07:00:00Z',
                sport: 'running',
                goalDuration: 3600,
                goalRpe: 0.8, // Hard interval session
                description: 'VO2max intervals',
              },
              {
                startDate: '2025-01-03T06:00:00Z', // Only 24h later - CRITICAL ERROR!
                endDate: '2025-01-03T07:00:00Z',
                sport: 'running',
                goalDuration: 3600,
                goalRpe: 0.75, // Hard tempo session
                description: 'Tempo run',
              },
            ],
          },
        ],
      },
    ],
  },
};

// Expected result:
// valid=false
// errors: [{ type: 'CONSECUTIVE_HARD', severity: 'CRITICAL', ... }]

// ============================================================================
// Example 4: Plan with Poor 80/20 Distribution (Should Warn)
// ============================================================================

const planWithTooMuchIntensity = {
  plan: {
    name: 'All Hard All The Time',
    goal: 'Marathon',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-02-01T00:00:00Z',
    cycles: [
      {
        name: 'Intensity overload',
        phase: 'SPECIFIC' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T00:00:00Z',
        weeks: [
          {
            weekNumber: 1,
            startDate: '2025-01-01T00:00:00Z',
            endDate: '2025-01-07T00:00:00Z',
            targetVolume: 21600,
            sessions: [
              {
                startDate: '2025-01-02T06:00:00Z',
                endDate: '2025-01-02T07:00:00Z',
                sport: 'running',
                goalDuration: 7200, // 2h hard - 33% of weekly volume
                goalRpe: 0.8,
                description: 'Hard intervals',
              },
              {
                startDate: '2025-01-04T06:00:00Z',
                endDate: '2025-01-04T07:00:00Z',
                sport: 'running',
                goalDuration: 7200, // 2h hard
                goalRpe: 0.75,
                description: 'Tempo run',
              },
              {
                startDate: '2025-01-06T06:00:00Z',
                endDate: '2025-01-06T07:00:00Z',
                sport: 'running',
                goalDuration: 7200, // 2h easy - only 33% easy!
                goalRpe: 0.4,
                description: 'Easy run',
              },
            ],
          },
        ],
      },
    ],
  },
};

// Expected result:
// valid=false (if >30% hard)
// errors: [{ type: 'INTENSITY_IMBALANCE', severity: 'CRITICAL' or 'WARNING', ... }]

// ============================================================================
// Example 5: Using Custom Constraints
// ============================================================================

const customConstraintsExample = {
  plan: validPlan.plan,
  constraints: {
    hardSessionRpeThreshold: 0.75, // Stricter definition of "hard"
    maxWeeklyVolumeIncrease: 8, // More conservative progression
    minRestDaysPerWeek: 2, // More recovery
    targetEasyHardRatio: 85, // 85/15 instead of 80/20
  },
};

// This would validate the same plan but with stricter rules

// ============================================================================
// How to Run Validation
// ============================================================================

async function exampleValidation() {
  // Mock runtime context (in real usage, this comes from Mastra)
  const runtimeContext = new Map<string, any>([
    ['athleteId', 123],
    ['prisma', {} /* actual PrismaService instance */],
  ]);

  try {
    const result = await validatePlanTool.execute({
      context: validPlan,
      runtimeContext,
    });

    console.log('Validation Result:');
    console.log(`Valid: ${result.valid}`);
    console.log(`Score: ${result.overallScore}/100`);
    console.log(`Summary: ${result.summary}`);
    console.log(`\nMetrics:`);
    console.log(
      `  Average weekly volume: ${(result.metrics.averageWeeklyVolume / 3600).toFixed(1)}h`,
    );
    console.log(
      `  Total plan volume: ${(result.metrics.totalPlanVolume / 3600).toFixed(0)}h`,
    );
    console.log(
      `  Easy:Hard ratio: ${result.metrics.easyHardRatio.toFixed(1)}:1`,
    );
    console.log(
      `  Largest weekly increase: ${result.metrics.largestWeeklyIncrease.toFixed(1)}%`,
    );

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((error, i) => {
        console.log(`\n${i + 1}. [${error.severity}] ${error.type}`);
        console.log(`   ${error.description}`);
        console.log(`   Suggestion: ${error.suggestion}`);
      });
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

// ============================================================================
// Expected Console Output for Valid Plan
// ============================================================================

/*
Validation Result:
Valid: true
Score: 95/100
Summary: Plan validation score: 95/100. Plan is ready for athlete approval. Total plan: 10h over 3 sessions/week avg. Easy:Hard ratio 4.3:1. Plan is ready for athlete approval.

Metrics:
  Average weekly volume: 5.3h
  Total plan volume: 10h
  Easy:Hard ratio: 4.3:1
  Largest weekly increase: 10.0%
*/

// ============================================================================
// Expected Console Output for Plan with Load Spike
// ============================================================================

/*
Validation Result:
Valid: false
Score: 80/100
Summary: Plan validation score: 80/100. Found 1 CRITICAL issue(s) that must be addressed before finalizing the plan. Total plan: 13h over 1 sessions/week avg. Easy:Hard ratio Infinity:1. Please fix critical issues before proceeding with this plan.

Metrics:
  Average weekly volume: 6.5h
  Total plan volume: 13h
  Easy:Hard ratio: Infinity:1
  Largest weekly increase: 60.0%

Errors (1):

1. [CRITICAL] LOAD_SPIKE
   Week 2 has a 60.0% volume increase from previous week (5.0h → 8.0h). This exceeds the safe limit of 15% and significantly increases injury risk.
   Suggestion: Reduce week 2 volume to max 5.8h, or spread the increase over multiple weeks with smaller increments.
*/

export {};
