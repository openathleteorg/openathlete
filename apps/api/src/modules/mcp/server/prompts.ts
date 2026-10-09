import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/** What every agent reads first (the initialize instructions) */
export const SERVER_INSTRUCTIONS = `OpenAthlete holds an endurance athlete's training: planned sessions, activities synced from their devices, metrics, training zones and training load. Coaches reach the athletes they coach.

How to work:
- Call get_athlete_context first. It gives today's date in the athlete's time zone, zones (with the ids workout targets use), metrics, form, coming races and periods.
- Dates and times are local to the athlete: YYYY-MM-DD and HH:mm, never UTC.
- Read before you write: get_calendar for the weeks concerned, get_training_load for load and form, get_training_volume and get_activities for history.
- Plan whole blocks at once with plan_sessions (up to 60 sessions). Give key sessions a structured workout (workoutSteps) with targets from the athlete's zones, paces or percentages of VMA, FTP or HR max.
- Every change shows in the athlete's calendar at once and reaches their watch: say what you are about to change before large edits, and prefer move_sessions and update_session over deleting and recreating.
- Illness, injury or travel: record it with create_period, then adapt the sessions it returns.
- Done sessions and recorded activities are the athlete's history: they cannot be changed here.

Units: distances in km, planned durations in minutes, workout steps in seconds or meters, paces as m:ss per km, effort (RPE) 1-10, load in TRIMP.`;

/** server.registerPrompt, typed by our schemas (see registerTool) */
function registerPrompt<Shape extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  config: { title: string; description: string; argsSchema: Shape },
  handler: (args: z.output<z.ZodObject<Shape>>) => ReturnType<typeof text>,
) {
  (server.registerPrompt as (...args: unknown[]) => unknown).call(
    server,
    name,
    config,
    handler,
  );
}

const text = (value: string) => ({
  messages: [
    { role: 'user' as const, content: { type: 'text' as const, text: value } },
  ],
});

export function registerPrompts(server: McpServer, canWrite: boolean) {
  const apply = canWrite
    ? 'Show me the plan week by week and ask before saving it. Once I agree, save it with create_period and plan_sessions, then check the projected form with get_training_load.'
    : 'This connection can only read: present the plan so I can enter it, or ask me to reconnect with write access.';

  registerPrompt(
    server,
    'plan_training',
    {
      title: 'Build a training plan',
      description:
        'A periodized plan towards a goal, built from the athlete history, load and zones.',
      argsSchema: {
        goal: z
          .string()
          .describe('E.g. "marathon under 3h30", "first 100 km trail"'),
        raceDate: z.string().optional().describe('YYYY-MM-DD, if a race'),
        hoursPerWeek: z.string().optional().describe('Time available'),
        sessionsPerWeek: z.string().optional(),
        constraints: z
          .string()
          .optional()
          .describe('Days off, other sports, injuries, equipment...'),
      },
    },
    ({ goal, raceDate, hoursPerWeek, sessionsPerWeek, constraints }) =>
      text(`Build my training plan in OpenAthlete.

Goal: ${goal}${raceDate ? `\nRace date: ${raceDate}` : ''}${hoursPerWeek ? `\nTime available per week: ${hoursPerWeek}` : ''}${sessionsPerWeek ? `\nSessions per week: ${sessionsPerWeek}` : ''}${constraints ? `\nConstraints: ${constraints}` : ''}

Method:
1. get_athlete_context, then get_training_volume and get_activities over the last 12 weeks, get_training_load, get_records for the main sport, and get_calendar for the weeks to plan (keep what is already there).
2. Start from the volume really done, not the time available. Raise the weekly load by 5-10% at most, with a lighter week (-30 to -40%) every third or fourth week.
3. Periodize up to the goal: base, build, specific, then a taper of 1 to 3 weeks depending on the distance. Keep about 80% of the time easy.
4. Key sessions (intervals, tempo, long run or ride) get structured workouts with the athlete's zones or paces from their records and metrics. Easy sessions only need a duration and a zone.
5. Respect periods without training, and keep any A race the focus; B and C races replace a key session.
6. Aim for a form (TSB) of +5 to +15 on race day.

${apply} Answer in my language.`),
  );

  registerPrompt(
    server,
    'adapt_plan',
    {
      title: 'Adapt the plan',
      description:
        'Rework the coming sessions after an illness, injury, trip, fatigue or a missed week.',
      argsSchema: {
        situation: z
          .string()
          .describe(
            'E.g. "flu with fever since Monday", "knee pain on descents"',
          ),
        from: z.string().optional().describe('YYYY-MM-DD, default today'),
        until: z.string().optional().describe('YYYY-MM-DD, if known'),
      },
    },
    ({ situation, from, until }) =>
      text(`Adapt my training in OpenAthlete.

Situation: ${situation}${from ? `\nSince: ${from}` : ''}${until ? `\nUntil: ${until}` : ''}

Method:
1. get_athlete_context (injuries, races, periods), get_calendar for the next 3 weeks, get_training_load, and the latest resting HR and HRV with get_metrics.
2. Illness: symptoms above the neck allow easy sessions; fever, chest symptoms or aches mean rest until 24-48 h without them. Injury: no sessions that load the painful area, cross-train if pain allows, and suggest seeing a professional. Travel: short sessions or rest. Fatigue or a missed week: never squeeze the missed sessions into the next days.
3. Record the period with create_period (illness, injury or travel), then for the sessions it returns, and those just after it, decide: rest, shorter and easier, or moved.
4. Come back progressively: about two easy days per day off, key sessions only once easy ones feel normal. Re-check the next A race: is the goal still realistic?

${
  canWrite
    ? 'Tell me what you will change and ask before applying it with move_sessions, update_session and delete_sessions; then show the new form with get_training_load.'
    : 'This connection can only read: tell me what to change.'
} Answer in my language.`),
  );

  registerPrompt(
    server,
    'review_week',
    {
      title: 'Review a week',
      description:
        'Compare what was planned and done, read the feedback, and suggest the next week.',
      argsSchema: {
        weekOf: z
          .string()
          .optional()
          .describe(
            'A day of the week to review, YYYY-MM-DD; default last week',
          ),
      },
    },
    ({ weekOf }) =>
      text(`Review my training week in OpenAthlete${weekOf ? ` (the week of ${weekOf})` : ' (last week, Monday to Sunday)'}.

1. get_athlete_context, then get_calendar for that week and the next one.
2. For each planned session: done, partly done or missed? For key sessions and races, read get_activity (laps, heart rate, and my feedback answers).
3. get_training_load: weekly load against the recommended range, fatigue and form trend; get_metrics for resting HR, HRV and sleep if recorded.
4. Tell me what went well, what to watch (fatigue, pain mentioned in feedback, too much intensity), and what to change in the coming week.

${canWrite ? 'Suggest the changes and ask before applying them.' : ''} Answer in my language.`),
  );
}
