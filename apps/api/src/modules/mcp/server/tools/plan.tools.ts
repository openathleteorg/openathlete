import { z } from 'zod';

import { PLAN_ANCHOR, TRAINING_PLAN_CONFLICT_MODE } from '@openathlete/shared';

import { athleteIdInput, run } from '../context';
import { localDate } from '../dates';
import { READ_ONLY, ToolRegistrar, registerTool } from './deps';

const libraryPlanSchema = z.object({
  templateId: z.number(),
  name: z.string(),
  goal: z.string(),
  sport: z.string().nullable(),
  level: z.string().nullable(),
  weeks: z.number(),
  sessions: z.number(),
});

const appliedPlanSchema = z.object({
  trainingPlanId: z.number(),
  name: z.string(),
  status: z.string(),
  templateId: z.number().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  currentWeek: z.number().nullable(),
  weeks: z.number(),
  sessions: z.number(),
  done: z.number(),
  modified: z.number(),
});

const plansOutput = z.object({
  library: z.array(libraryPlanSchema),
  applied: z.array(appliedPlanSchema),
});

const applyOutput = z.object({
  trainingPlanId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  sessions: z.number(),
  skipped: z.number(),
  replaced: z.number(),
});

/** Reading and applying the user's library of training plans */
export const registerPlanReadTools: ToolRegistrar = (server, ctx, deps) => {
  registerTool(
    server,
    'list_plans',
    {
      title: 'List training plans',
      description:
        "The user's library of training plans (laid out by week and weekday, not dated) and the plans applied to the athlete, with their dates, current week and progress.",
      inputSchema: { athleteId: athleteIdInput },
      outputSchema: plansOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId }) =>
      run(plansOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const [library, applied] = await Promise.all([
          deps.plans.listTemplates(ctx.user),
          deps.plans.listApplied(ctx.user, {
            athleteId: scope.athleteId,
            includeArchived: false,
          }),
        ]);
        return {
          library: library.map((plan) => ({
            ...plan,
            templateId: plan.trainingPlanTemplateId,
          })),
          applied,
        };
      }),
  );
};

export const registerPlanWriteTools: ToolRegistrar = (server, ctx, deps) => {
  registerTool(
    server,
    'apply_plan',
    {
      title: 'Apply a training plan',
      description:
        "Puts a plan of the user's library on the athlete's calendar, as one block that can later be moved or removed whole: by its first day (anchor start) or its last day, usually race day (anchor end). Sessions before the start or after the race in their week are skipped. Watches get the workouts of the coming days.",
      inputSchema: {
        athleteId: athleteIdInput,
        templateId: z.number().int().describe('From list_plans'),
        date: localDate.describe('First day (start) or last day (end)'),
        anchor: z
          .enum(['start', 'end'])
          .default('start')
          .describe('Which end of the plan the date fixes'),
        weekStartsOn: z
          .number()
          .int()
          .min(0)
          .max(6)
          .default(1)
          .describe('First day of the plan weeks: 1 Monday, 0 Sunday'),
        replaceExisting: z
          .boolean()
          .default(false)
          .describe(
            'Remove trainings still to do already planned on those days',
          ),
      },
      outputSchema: applyOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ athleteId, templateId, date, anchor, weekStartsOn, replaceExisting }) =>
      run(applyOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const dto = {
          targets: [{ athleteId: scope.athleteId, date }],
          anchor: anchor === 'end' ? PLAN_ANCHOR.END : PLAN_ANCHOR.START,
          weekStartsOn,
          conflictMode: replaceExisting
            ? TRAINING_PLAN_CONFLICT_MODE.REPLACE
            : TRAINING_PLAN_CONFLICT_MODE.KEEP,
        };
        const [preview] = await deps.plans.previewApply(
          ctx.user,
          templateId,
          dto,
        );
        const plan = await deps.plans.checkApply(ctx.user, templateId, dto);
        const { targets, ...options } = dto;
        const result = await deps.plans.applyToAthlete(
          plan,
          targets[0],
          options,
        );
        return {
          trainingPlanId: result.trainingPlanId,
          startDate: preview.startDate,
          endDate: preview.endDate,
          sessions: result.sessions,
          skipped: preview.skipped,
          replaced: result.replaced,
        };
      }),
  );

  registerTool(
    server,
    'shift_plan',
    {
      title: 'Move an applied plan',
      description:
        'Moves what is still to do of an applied plan by whole days, at the same time of day: when the race moves, the plan follows. Done sessions stay.',
      inputSchema: {
        trainingPlanId: z.number().int().describe('From list_plans'),
        days: z.number().int().min(-366).max(366).describe('7 = a week later'),
      },
      outputSchema: z.object({ trainingPlanId: z.number(), moved: z.number() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ trainingPlanId, days }) =>
      run(z.object({ trainingPlanId: z.number(), moved: z.number() }), () =>
        deps.plans.shiftApplied(ctx.user, trainingPlanId, { days }),
      ),
  );

  registerTool(
    server,
    'remove_plan',
    {
      title: 'Remove an applied plan',
      description:
        'Deletes the sessions still to do of an applied plan, and their workouts on the watch. Done and past sessions stay as history. Ask the athlete first.',
      inputSchema: {
        trainingPlanId: z.number().int().describe('From list_plans'),
      },
      outputSchema: z.object({
        trainingPlanId: z.number(),
        removed: z.number(),
        kept: z.number(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ trainingPlanId }) =>
      run(
        z.object({
          trainingPlanId: z.number(),
          removed: z.number(),
          kept: z.number(),
        }),
        () => deps.plans.removeApplied(ctx.user, trainingPlanId),
      ),
  );
};
