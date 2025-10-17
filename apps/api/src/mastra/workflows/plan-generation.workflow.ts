import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { athleteProfileAgent } from '../agents/athlete-profile.agent';
import { macroPlanAgent, macroPlanSchema } from '../agents/macro-plan.agent';
import {
  mesoBlocksOutputSchema,
  mesoPlanAgent,
} from '../agents/meso-plan.agent';
import {
  microPlanAgent,
  weekIntentionsOutputSchema,
} from '../agents/micro-plan.agent';
import { qaAgent } from '../agents/qa.agent';
import { schedulingAgent } from '../agents/scheduling.agent';
import {
  athleteFactsSchema,
  macroPlanSchema as macroPlanSchemaType,
  mesoBlockSchema,
  scheduledWeekSchema,
  validationErrorSchema,
  validationReportSchema,
  weekIntentionsSchema,
} from '../types';

// TODO: Workflow for complete training plan generation from athlete profile to saved plan
//
// PURPOSE:
// Orchestrate the deterministic process of creating a training plan through all stages:
// Profile → Macro → Meso → Micro → Scheduling → QA → Persistence
//
// STEPS:
// 1. Profile Analysis: Extract athlete data and create AthleteFacts
// 2. Macro Planning: Design overall phase structure and strategy
// 3. Meso Planning: Break phases into week-by-week blocks
// 4. Micro Planning: Generate specific session plans for each week
// 5. Scheduling: Assign sessions to calendar days/times
// 6. Quality Assurance: Validate complete plan
// 7. Persistence: Save to database
//
// ERROR HANDLING:
// - If QA returns CRITICAL errors, halt before persistence
// - Return plan structure + validation report for user review
// - Allow manual approval before final save

// Step 1: Profile Analysis
const profileStep = createStep({
  id: 'profile-analysis',
  description: 'Analyze athlete profile and gather baseline data',
  inputSchema: z.object({
    athleteId: z.number(),
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
    preferences: z
      .object({
        preferredTrainingDays: z.array(z.number()).optional(),
        avoidDays: z.array(z.number()).optional(),
        maxWeeklyVolume: z.number().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    athleteFacts: athleteFactsSchema,
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const currentDate = new Date().toISOString();
      const { athleteId } = inputData;

      // Default analysis period: last 8 weeks
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 56); // 8 weeks

      const startDate = defaultStartDate.toISOString();
      const endDate = defaultEndDate.toISOString();

      const prompt = `[CURRENT DATE: ${new Date(currentDate).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}]

Create a comprehensive athlete profile by analyzing all available data for athlete ID ${athleteId}.

ANALYSIS PERIOD:
- Start Date: ${new Date(startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
- End Date: ${new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}

YOUR TASKS:

1. Fetch athlete basic data (age, weight, experience level, goals)
2. Retrieve weekly availability windows 
3. Calculate current training load metrics (acute load, chronic load, ACR)
4. Analyze recent training history to determine:
   - Average weekly volume and trend (increasing/stable/decreasing)
   - Longest run in the analysis period
   - Average pace across all runs
   - Intensity distribution patterns
5. Identify any constraints or limitations

Use the available tools to gather this information, then synthesize it into a structured AthleteFacts object.

Pay special attention to:
- Signs of overtraining (high acute:chronic ratio > 1.5)
- Significant volume changes (>15% week-to-week)
- Training consistency (gaps in training)
- Available training time vs. current volume

OUTPUT FORMAT:
Provide your analysis as a JSON object matching the AthleteFacts schema with these fields:
{
  "athleteId": number,
  "name": string (optional),
  "email": string (optional),
  "currentFitness": {
    "recentWeeklyVolume": number (average weekly volume in seconds over last 4 weeks),
    "recentWeeklyDistance": number (average weekly distance in meters),
    "longestRecentRun": number (longest run in last 8 weeks in meters),
    "currentLoad": {
      "weeklyTrimp": number,
      "acuteChronicRatio": number
    }
  },
  "availability": [{
    "dayOfWeek": number (0=Sunday, 1=Monday, ..., 6=Saturday),
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "priority": "LOW" | "MEDIUM" | "HIGH"
  }],
  "constraints": {
    "maxWeeklyVolume": number (optional, in seconds),
    "preferredRestDays": number[] (optional, days 0-6),
    "avoidDays": number[] (optional, days 0-6),
    "injuries": string[] (optional)
  },
  "experienceLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE" (optional),
  "trainingHistory": string (optional, narrative summary of training background)
}

Be thorough in your analysis and provide context for your findings.`;

      console.log(
        `[profileStep] Calling athlete-profile agent for athlete ${athleteId}`,
      );

      const response = await athleteProfileAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: athleteFactsSchema,
        },
      });

      console.log('[profileStep] Received structured response from agent');

      const athleteFacts = response.object;

      console.log('[profileStep] Successfully validated AthleteFacts');
      console.log(
        '[profileStep] Weekly volume:',
        athleteFacts.currentFitness.recentWeeklyVolume,
        'seconds',
      );
      console.log(
        '[profileStep] Availability slots:',
        athleteFacts.availability.length,
      );

      return { athleteFacts, goal: inputData.goal };
    } catch (error) {
      console.error('[profileStep] Error:', error);
      throw new Error(
        `Failed to analyze athlete profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 2: Macro Planning
const macroStep = createStep({
  id: 'macro-planning',
  description: 'Design high-level training phase structure',
  inputSchema: z.object({
    athleteFacts: athleteFactsSchema,
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
  }),
  outputSchema: z.object({
    macroPlan: macroPlanSchemaType,
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      // Build prompt for macro-plan agent
      const currentDate = new Date().toISOString();

      const prompt = `[CURRENT DATE: ${new Date(currentDate).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}]

Design a comprehensive macro training plan for the following:

ATHLETE PROFILE:
${JSON.stringify(inputData.athleteFacts, null, 2)}

GOAL RACE:
- Race: ${inputData.goal.raceName}
- Date: ${new Date(inputData.goal.raceDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
- Distance: ${(inputData.goal.distance / 1000).toFixed(1)}km
- Elevation Gain: ${inputData.goal.elevationGain}m
- Terrain: ${inputData.goal.terrain || 'MIXED'}

Please create a periodized macro plan with:
1. Appropriate phase structure (BASE → SPECIFIC → TAPER)
2. Realistic volume progression based on current fitness
3. Key milestones and checkpoints
4. Clear strategy and rationale

Consider:
- Time available until race (weeks from today to race day)
- Current fitness level and weekly volume
- Race distance and demands
- Need for adequate base, specific work, and taper`;

      // Call macro-plan agent with structured output
      const response = await macroPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: macroPlanSchemaType,
        },
      });

      const macroPlan = response.object;

      console.log('[macroStep] Macro plan generated successfully');

      return {
        macroPlan,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[macroStep] Failed to generate macro plan:', error);
      throw new Error(
        `Macro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 3: Meso Planning
const mesoStep = createStep({
  id: 'meso-planning',
  description: 'Break phases into weekly training blocks',
  inputSchema: z.object({
    macroPlan: macroPlanSchemaType,
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      // Build prompt for meso-plan agent
      const prompt = `Break down the following macro plan into detailed meso-cycles (3-4 week training blocks).

MACRO PLAN:
${JSON.stringify(inputData.macroPlan, null, 2)}

ATHLETE PROFILE:
Current Weekly Volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h
Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

For each phase in the macro plan, create meso-cycles with:

1. WEEK-BY-WEEK BREAKDOWN:
   - Assign each week a specific date range
   - Set realistic volume targets in seconds (use macro phase targets as guide)
   - Apply 10% rule: no more than 10% volume increase per week
   - Include recovery weeks every 3-4 weeks (20-40% volume reduction)

2. PROGRESSION PATTERNS:
   - Use 3:1 pattern (3 weeks build + 1 recovery) for most blocks
   - Consider 2:1 pattern if athlete is less experienced
   - Ensure smooth progression between blocks

3. BLOCK THEMES:
   BASE phase blocks should focus on: aerobic foundation, volume building, endurance
   SPECIFIC phase blocks should focus on: VO2max, threshold, race-specific work
   TAPER phase blocks should focus on: volume reduction, maintaining intensity, freshness

4. INTENSITY FOCUS:
   - Assign each week an intensity focus: EASY, MODERATE, HARD, or MIXED
   - Most weeks should be EASY (80/20 principle)
   - Hard weeks should be separated by easy/recovery weeks

5. STARTING POINT:
   - Start first week at or slightly above athlete's current weekly volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h (${inputData.athleteFacts.currentFitness.recentWeeklyVolume}s)
   - Build gradually from there

Please create detailed meso-blocks for the entire plan duration.`;

      // Call meso-plan agent with structured output
      const response = await mesoPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: mesoBlocksOutputSchema,
        },
      });

      const mesoBlocks = response.object.mesoBlocks;

      console.log(
        `[mesoStep] Generated ${mesoBlocks.length} meso-blocks successfully`,
      );

      return {
        mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[mesoStep] Failed to generate meso plan:', error);
      throw new Error(
        `Meso planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 4: Micro Planning
const microStep = createStep({
  id: 'micro-planning',
  description: 'Generate specific training sessions for each week',
  inputSchema: z.object({
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    weekIntentions: z.array(weekIntentionsSchema),
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const allWeekIntentions: z.infer<typeof weekIntentionsSchema>[] = [];

      // Extract all weeks from all meso blocks
      const allWeeks = inputData.mesoBlocks.flatMap((block) =>
        block.weeks.map((week) => ({
          ...week,
          blockTheme: block.blockTheme,
          phaseName: block.phaseName,
        })),
      );

      console.log(
        `[microStep] Generating sessions for ${allWeeks.length} weeks...`,
      );

      // Process each week sequentially (could be parallelized in future)
      for (const week of allWeeks) {
        const prompt = `Create detailed training sessions for this specific week:

WEEK DETAILS:
- Week Number: ${week.weekNumber}
- Dates: ${new Date(week.startDate).toLocaleDateString()} - ${new Date(week.endDate).toLocaleDateString()}
- Theme: ${week.theme}
- Target Volume: ${(week.targetVolume / 3600).toFixed(1)}h (${week.targetVolume} seconds)
- Intensity Focus: ${week.intensityFocus}
- Is Recovery Week: ${week.isRecoveryWeek}
- Block Theme: ${week.blockTheme}
- Phase: ${week.phaseName}

ATHLETE PROFILE:
- Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
- Current Weekly Volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h
- Longest Recent Run: ${(inputData.athleteFacts.currentFitness.longestRecentRun / 1000).toFixed(1)}km
- Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

REQUIREMENTS:
1. Create 4-7 training sessions for this week
2. Total session durations should equal target volume (${week.targetVolume}s)
3. Apply 80/20 rule: ~80% of volume at easy intensity (RPE ≤ 0.5), ~20% hard
4. Match intensity focus: ${week.intensityFocus}
5. Include appropriate session variety:
   - At least one long run (if not recovery week)
   - 1-2 key workouts based on block theme and intensity focus
   - Multiple easy runs to fill volume
   - Optional: strength training
   - At least 1 rest day

6. Session Types Based on Phase:
   ${week.phaseName === 'BASE' ? '- Focus on easy runs and long runs\n   - Max 1 key workout (tempo or hills, keep moderate)\n   - Include strength training' : ''}
   ${week.phaseName === 'SPECIFIC' ? '- Include 2 key workouts (VO2, threshold, or race pace)\n   - Long run with race-specific segments\n   - Reduce strength work' : ''}
   ${week.phaseName === 'TAPER' ? '- Reduce all durations significantly\n   - Keep intensity but reduce volume\n   - More rest days' : ''}

7. For each session provide:
   - type: INTERVAL, LONG_RUN, TEMPO, EASY, RECOVERY, STRENGTH, or RACE
   - sport: RUNNING, CYCLING, SWIMMING, STRENGTH, or OTHER
   - targetDuration: in seconds
   - targetDistance: in meters (optional, estimate based on duration and pace)
   - targetElevationGain: in meters (optional)
   - targetIntensity: {zone: "Z1", "Z2", etc., rpe: 0.0-1.0}
   - description: detailed description of the workout
   - priority: HIGH (key workouts), MEDIUM (long run), LOW (easy runs)

8. DO NOT assign days or times - leave dayOfWeek as null

Create a comprehensive week of training that matches the theme and volume target.`;

        // Call micro-plan agent with structured output
        const response = await microPlanAgent.generate(prompt, {
          runtimeContext,
          structuredOutput: {
            schema: weekIntentionsOutputSchema,
          },
        });

        const weekIntentions = response.object;

        allWeekIntentions.push(weekIntentions);

        console.log(
          `[microStep] Generated ${weekIntentions.sessions.length} sessions for week ${week.weekNumber}`,
        );
      }

      console.log(
        `[microStep] Successfully generated sessions for all ${allWeeks.length} weeks`,
      );

      return {
        weekIntentions: allWeekIntentions,
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[microStep] Failed to generate micro plan:', error);
      throw new Error(
        `Micro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 5: Scheduling
const schedulingStep = createStep({
  id: 'scheduling',
  description: 'Assign sessions to specific days and times',
  inputSchema: z.object({
    weekIntentions: z.array(weekIntentionsSchema),
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    scheduledWeeks: z.array(scheduledWeekSchema),
    schedulingMetadata: z.object({
      totalScheduled: z.number().describe('Total sessions successfully placed'),
      totalUnscheduled: z
        .number()
        .describe('Total sessions that could not be placed'),
      overallWarnings: z
        .array(z.string())
        .describe('Global warnings across all weeks'),
      conflictResolutions: z
        .array(z.string())
        .describe('How conflicts were resolved'),
    }),
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const scheduledWeeks: z.infer<typeof scheduledWeekSchema>[] = [];
      const overallWarnings: string[] = [];
      let totalScheduled = 0;
      let totalUnscheduled = 0;

      console.log(
        `[schedulingStep] Scheduling ${inputData.weekIntentions.length} weeks...`,
      );

      // Process each week sequentially
      for (const weekIntentions of inputData.weekIntentions) {
        const currentDate = new Date().toISOString();

        const prompt = `[CURRENT DATE: ${new Date(
          currentDate,
        ).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}]

Schedule the following week's training sessions into the athlete's calendar.

=== WEEK TO SCHEDULE ===
Week Number: ${weekIntentions.weekNumber}
Dates: ${new Date(weekIntentions.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })} - ${new Date(weekIntentions.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
Theme: ${weekIntentions.theme}
Target Volume: ${(weekIntentions.targetVolume / 3600).toFixed(1)} hours (${weekIntentions.targetVolume} seconds)

Sessions to Schedule (${weekIntentions.sessions.length} total):
${weekIntentions.sessions
  .map((s, i) => {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const preferredDayText =
      s.dayOfWeek !== null && s.dayOfWeek !== undefined
        ? `- Preferred Day: ${dayNames[s.dayOfWeek]}`
        : '';

    return `
${i + 1}. ${s.type} - ${s.sport}
   - Duration: ${(s.targetDuration / 60).toFixed(0)} minutes
   - Intensity: RPE ${s.targetIntensity.rpe.toFixed(2)} (Zone ${s.targetIntensity.zone || 'N/A'})
   - Priority: ${s.priority}
   - Description: ${s.description}
   ${preferredDayText}`;
  })
  .join('\n')}

=== ATHLETE CONTEXT ===
Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

=== YOUR TASK ===
1. Use the fetchAthleteAvailabilityTool to get the athlete's weekly availability
2. Analyze the availability pattern (longest windows, high-priority slots)
3. Place each session strategically:
   - Respect CRITICAL rules (24h hard session spacing, availability fit)
   - Follow HIGH PRIORITY rules when possible (rest days, smart long run placement)
   - Adapt to athlete's unique schedule (not rigid weekly patterns)
4. For each scheduled session, provide:
   - scheduledDate: ISO date string (e.g., "${weekIntentions.startDate}")
   - scheduledTime: HH:mm format (e.g., "08:00")
   - availabilitySlotId: ID of the slot used (from fetchAthleteAvailabilityTool)
   - schedulingNotes: Brief explanation of placement rationale
5. If unable to place a session:
   - Add to unscheduledSessions array
   - Explain WHY in schedulingWarnings
   - Suggest solutions

=== CRITICAL REMINDERS ===
- Check cross-week boundaries for hard session spacing (if previous week ended with hard session on Sunday, don't place hard session on Monday)
- Long runs are NOT required to be on weekends - adapt to availability
- Be flexible and athlete-centered in your placement strategy
- Provide clear reasoning for your scheduling decisions

Output a ScheduledWeek object with all fields populated according to the schema.`;

        console.log(
          `[schedulingStep] Calling scheduling agent for week ${weekIntentions.weekNumber}`,
        );

        // Call scheduling agent with structured output
        const response = await schedulingAgent.generate(prompt, {
          runtimeContext,
          structuredOutput: {
            schema: scheduledWeekSchema,
          },
        });

        const scheduledWeek = response.object;

        // Aggregate statistics
        totalScheduled += scheduledWeek.sessions.length;
        totalUnscheduled += scheduledWeek.unscheduledSessions?.length || 0;

        if (scheduledWeek.schedulingWarnings?.length) {
          overallWarnings.push(
            `Week ${weekIntentions.weekNumber}: ${scheduledWeek.schedulingWarnings.join('; ')}`,
          );
        }

        scheduledWeeks.push(scheduledWeek);

        console.log(
          `[schedulingStep] Week ${weekIntentions.weekNumber}: ${scheduledWeek.sessions.length} scheduled, ${scheduledWeek.unscheduledSessions?.length || 0} unscheduled`,
        );
      }

      console.log(
        `[schedulingStep] Scheduling complete: ${totalScheduled} sessions scheduled, ${totalUnscheduled} unscheduled`,
      );

      return {
        scheduledWeeks,
        schedulingMetadata: {
          totalScheduled,
          totalUnscheduled,
          overallWarnings,
          conflictResolutions:
            totalUnscheduled > 0
              ? [
                  `${totalUnscheduled} sessions could not be placed due to availability or constraint conflicts. Review unscheduledSessions in affected weeks for details.`,
                ]
              : ['All sessions successfully scheduled with no conflicts.'],
        },
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[schedulingStep] Failed to schedule sessions:', error);
      throw new Error(
        `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 6: Quality Assurance
const qaStep = createStep({
  id: 'quality-assurance',
  description:
    'Validate complete training plan against evidence-based constraints and best practices',
  inputSchema: z.object({
    scheduledWeeks: z.array(scheduledWeekSchema),
    schedulingMetadata: z.object({
      totalScheduled: z.number(),
      totalUnscheduled: z.number(),
      overallWarnings: z.array(z.string()),
      conflictResolutions: z.array(z.string()),
    }),
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    validationReport: z.any(),
    scheduledWeeks: z.array(z.any()),
    mesoBlocks: z.array(z.any()),
    athleteFacts: z.any(),
    schedulingMetadata: z.any(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    console.log(
      `[qaStep] Starting validation for ${inputData.scheduledWeeks.length} weeks`,
    );

    try {
      // Transform scheduledWeeks into the format expected by validatePlanTool
      // The tool expects TrainingPlan with proper Session format:
      // - startDate/endDate (ISO strings)
      // - goalDuration (seconds)
      // - goalRpe (0-1 scale)
      // - goalDistance (meters)
      // - sport (string)

      const cycles = inputData.mesoBlocks.map((block, idx) => {
        // Find the first week number in this block
        const firstWeek = block.weeks[0]?.weekNumber || 1;
        const lastWeek =
          block.weeks[block.weeks.length - 1]?.weekNumber || firstWeek;

        const cycleWeeks = inputData.scheduledWeeks.filter(
          (week) => week.weekNumber >= firstWeek && week.weekNumber <= lastWeek,
        );

        return {
          name: block.phaseName || `Cycle ${idx + 1}`,
          phase: block.phaseName.includes('Base')
            ? 'BASE'
            : block.phaseName.includes('Taper')
              ? 'TAPER'
              : block.phaseName.includes('Specific')
                ? 'SPECIFIC'
                : block.phaseName.includes('Recovery')
                  ? 'RECOVERY'
                  : 'COMPETITION',
          startDate: block.weeks[0]?.startDate || '',
          endDate: block.weeks[block.weeks.length - 1]?.endDate || '',
          weeks: cycleWeeks.map((week) => ({
            weekNumber: week.weekNumber,
            startDate: week.startDate,
            endDate: week.endDate,
            theme: week.theme,
            targetVolume: week.targetVolume,
            sessions: week.sessions.map((session) => ({
              startDate: session.scheduledDate || week.startDate,
              endDate: session.scheduledDate || week.startDate,
              sport: session.sport || 'RUNNING',
              goalDuration: session.targetDuration || 0, // seconds
              goalDistance: session.targetDistance || undefined, // meters
              goalRpe: session.targetIntensity?.rpe || 0, // 0-1 scale
              description: session.description,
            })),
          })),
        };
      });

      // Build the plan object with all required fields
      const trainingPlan = {
        name: `Training Plan for ${inputData.athleteFacts.name || 'Athlete'}`,
        goal: 'Complete training plan', // Simple goal for now
        startDate:
          inputData.scheduledWeeks[0]?.startDate || new Date().toISOString(),
        endDate:
          inputData.scheduledWeeks[inputData.scheduledWeeks.length - 1]
            ?.endDate || new Date().toISOString(),
        cycles,
      };

      // Build the prompt for QA agent
      const prompt = `You are validating a complete training plan for an athlete.

=== ATHLETE PROFILE ===
${JSON.stringify(inputData.athleteFacts, null, 2)}

=== PLAN STRUCTURE ===
Total Cycles: ${cycles.length}
Total Weeks: ${inputData.scheduledWeeks.length}
Total Scheduled Sessions: ${inputData.schedulingMetadata.totalScheduled}
Unscheduled Sessions: ${inputData.schedulingMetadata.totalUnscheduled}

=== SCHEDULING METADATA ===
${inputData.schedulingMetadata.overallWarnings.length > 0 ? `Warnings:\n${inputData.schedulingMetadata.overallWarnings.join('\n')}` : 'No scheduling warnings'}

${inputData.schedulingMetadata.conflictResolutions.join('\n')}

=== COMPLETE PLAN DATA ===
${JSON.stringify(trainingPlan, null, 2)}

=== YOUR TASK ===
Using the validatePlanTool, perform a comprehensive validation of this training plan. The tool will check:

1. **LOAD_PROGRESSION**: Weekly volume increases should not exceed ${15}% (except recovery weeks)
2. **RECOVERY_ADEQUACY**: At least ${1} rest day per week, recovery weeks every ${3 - 4} weeks
3. **HARD_SESSION_SPACING**: Minimum ${24}h between hard sessions (RPE ≥ ${0.7})
4. **INTENSITY_DISTRIBUTION**: ${80}% of volume should be easy/aerobic
5. **SESSION_DURATION**: Weekly totals should respect target volume ±10%
6. **RACE_SPECIFIC_PREPARATION**: Adequate preparation for race distance and terrain
7. **TAPER_VALIDATION**: Proper taper in final ${2 - 3} weeks before race

Call the tool with the cycles data structure provided above. The tool will return a ValidationReport with:
- valid: boolean (true if no CRITICAL errors)
- overallScore: 0-100 (quality score)
- errors: ValidationError[] (categorized by severity)
- metrics: ValidationMetrics (statistics about the plan)

After receiving the validation results, provide a brief natural language interpretation highlighting:
- Overall plan quality
- Most important issues (if any)
- Strengths of the plan
- Actionable recommendations (if errors exist)`;

      console.log('[qaStep] Calling QA agent with plan data');

      // Call QA agent - it will use validatePlanTool internally
      const response = await qaAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: validationReportSchema,
        },
      });

      const validationReport = response.object;

      console.log(
        `[qaStep] Validation complete - Valid: ${validationReport.valid}, Score: ${validationReport.overallScore}`,
      );

      if (validationReport.errors && validationReport.errors.length > 0) {
        const criticalErrors = validationReport.errors.filter(
          (e) => e.severity === 'CRITICAL',
        );
        const warningErrors = validationReport.errors.filter(
          (e) => e.severity === 'WARNING',
        );
        const infoErrors = validationReport.errors.filter(
          (e) => e.severity === 'INFO',
        );

        console.log(
          `[qaStep] Errors found: ${criticalErrors.length} critical, ${warningErrors.length} warnings, ${infoErrors.length} info`,
        );
      } else {
        console.log('[qaStep] No validation errors - plan is excellent!');
      }

      // Return validation report with passthrough data for finalizeStep
      return {
        validationReport,
        scheduledWeeks: inputData.scheduledWeeks,
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
        schedulingMetadata: inputData.schedulingMetadata,
      };
    } catch (error) {
      console.error('[qaStep] Validation failed:', error);
      throw new Error(
        `QA validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 7: Persistence
const persistenceStep = createStep({
  id: 'persistence',
  description: 'Save complete plan to database',
  inputSchema: z.object({
    athleteId: z.number(),
    macroPlan: z.any(),
    scheduledWeeks: z.array(z.any()),
    validationReport: z.any(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number(),
  }),
  execute: async ({ inputData }) => {
    // TODO: Only execute if validation passed
    // Convert structured plan to database format
    // Call save-plan tool
    throw new Error('Not implemented - persistenceStep');
  },
});

// TODO: Compose workflow properly with correct input/output chaining
// Current issue: Need to pass context through steps (athleteFacts, goal, etc.)
// Solution: Use workflow context or restructure step schemas to accept full context
//
// Intended flow:
//   .then(profileStep) → athleteFacts
//   .then(macroStep) → macroPlan (needs athleteFacts + goal)
//   .then(mesoStep) → mesoBlocks (needs macroPlan + athleteFacts)
//   .then(microStep) → weekIntentions (needs mesoBlocks + athleteFacts)
//   .then(schedulingStep) → scheduledWeeks (needs weekIntentions + athleteFacts)
//   .then(qaStep) → validationReport (needs scheduledWeeks + athleteFacts + macroPlan)
//   .then(persistenceStep) → success (needs all data)

// Final step: Convert generated plan to workflow output format
const finalizeStep = createStep({
  id: 'finalize',
  description:
    'Convert generated plan to final output format with validation results',
  inputSchema: z.object({
    validationReport: z.any(), // Using z.any() for compatibility with qaStep output
    scheduledWeeks: z.array(z.any()),
    mesoBlocks: z.array(z.any()),
    athleteFacts: z.any(),
    schedulingMetadata: z.any(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number().optional(),
    validationReport: z.any(), // Using z.any() to avoid type conflicts with complex nested structures
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    console.log(
      '[finalizeStep] Preparing final output with validation results',
    );

    const hasUnscheduledSessions =
      inputData.schedulingMetadata.totalUnscheduled > 0;
    const hasCriticalErrors = inputData.validationReport.errors
      ? inputData.validationReport.errors.some((e) => e.severity === 'CRITICAL')
      : false;

    const criticalErrorsCount = inputData.validationReport.errors
      ? inputData.validationReport.errors.filter(
          (e) => e.severity === 'CRITICAL',
        ).length
      : 0;

    const warningsCount = inputData.validationReport.errors
      ? inputData.validationReport.errors.filter(
          (e) => e.severity === 'WARNING',
        ).length
      : 0;

    // Determine overall success: plan is valid AND all sessions scheduled
    const overallSuccess =
      inputData.validationReport.valid && !hasUnscheduledSessions;

    // Build recommendation message
    let recommendation = '';
    if (!overallSuccess) {
      if (hasCriticalErrors) {
        recommendation = `Plan has ${criticalErrorsCount} CRITICAL validation errors that must be addressed before finalizing. `;
      }
      if (hasUnscheduledSessions) {
        recommendation += `${inputData.schedulingMetadata.totalUnscheduled} sessions could not be scheduled - review athlete availability. `;
      }
      if (warningsCount > 0) {
        recommendation += `${warningsCount} warnings should be reviewed for optimal plan quality.`;
      }
    } else {
      recommendation = `Plan is valid and ready for persistence. Quality score: ${inputData.validationReport.overallScore}/100. All sessions successfully scheduled with no critical issues.`;
    }

    // Build comprehensive message
    let message = '';
    if (overallSuccess) {
      message = `Training plan generated successfully! ${inputData.scheduledWeeks.length} weeks, ${inputData.schedulingMetadata.totalScheduled} sessions, validation score: ${inputData.validationReport.overallScore}/100.`;
    } else {
      message = `Training plan generated with issues: ${criticalErrorsCount} critical errors, ${warningsCount} warnings, ${inputData.schedulingMetadata.totalUnscheduled} unscheduled sessions.`;
    }

    console.log(
      `[finalizeStep] Complete - Success: ${overallSuccess}, Score: ${inputData.validationReport.overallScore}`,
    );

    return {
      success: overallSuccess,
      validationReport: {
        valid: inputData.validationReport.valid,
        overallScore: inputData.validationReport.overallScore,
        message,
        totalWeeks: inputData.scheduledWeeks.length,
        totalSessionsScheduled: inputData.schedulingMetadata.totalScheduled,
        totalSessionsUnscheduled: inputData.schedulingMetadata.totalUnscheduled,
        criticalErrorsCount,
        warningsCount,
        errors: inputData.validationReport.errors || [],
        metrics: inputData.validationReport.metrics,
        recommendation,
      },
      // trainingPlanId will be set by persistenceStep in the future
    };
  },
});

export const planGenerationWorkflow = createWorkflow({
  id: 'plan-generation',
  description:
    'CRITICAL WORKFLOW: Only use when athlete explicitly wants to CREATE A NEW TRAINING PLAN for a specific race. Requires race name, date, and distance. NOT for questions, data requests, or viewing existing data. Use qna agent for questions instead.',
  inputSchema: z.object({
    athleteId: z.number(),
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
    preferences: z
      .object({
        preferredTrainingDays: z.array(z.number()).optional(),
        avoidDays: z.array(z.number()).optional(),
        maxWeeklyVolume: z.number().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number().optional(),
    validationReport: z.any(),
    error: z.string().optional(),
  }),
})
  .then(profileStep)
  .then(macroStep)
  .then(mesoStep)
  .then(microStep)
  .then(schedulingStep)
  .then(qaStep)
  .then(finalizeStep)
  .commit();
