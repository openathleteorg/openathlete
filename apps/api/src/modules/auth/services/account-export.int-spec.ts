import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  COACH_USER_ID,
  DELETED_USER_ID as USER_ID,
  accountFixtureSql,
} from './account-deletion.fixture';
import {
  ACCOUNT_EXPORT_FORMAT,
  AccountExportService,
} from './account-export.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

/**
 * Tables holding a user's or athlete's rows, and where they go in the
 * export. A new table referencing them must be added to one of the lists:
 * the test below fails until it is.
 */
const EXPORTED_TABLES = [
  'agent_thread',
  'ai_credential',
  'ai_model_preference',
  'athlete',
  'athlete_availability',
  'athlete_injury',
  'athlete_metric',
  'athlete_settings',
  'coach_athlete',
  'cycle',
  'equipment',
  'event',
  'event_template',
  'message',
  'provider_account',
  'record',
  'subscription',
  'training_load_calculation',
  'training_plan',
  'training_zone',
];
const NOT_EXPORTED_TABLES = {
  athlete_invitation: 'pending invitations sent to other people',
  coach_invitation: 'pending invitations, also other people’s data',
  event_template_folder: 'exported with each template, by name',
  message_read_receipt: 'read markers, no content',
  message_thread_participant: 'conversation membership, no content',
  provider_workout_export: 'technical sync state with providers',
  token: 'password reset and invitation secrets',
};

/** The parts of the export document these tests read. */
interface ExportDocument {
  format: string;
  user: Record<string, unknown>;
  athlete: {
    metrics: unknown[];
    trainingZones: { values: unknown[] }[];
    injuries: unknown[];
    cycles: { weeks: unknown[] }[];
    providerAccounts: unknown[];
  };
  coaching: { coaches: unknown[] };
  templates: { event: { name: string } }[];
  aiAssistant: { messages: { blocks: { content: string }[] }[] }[];
  aiSettings: { keys: unknown[] };
  messages: unknown[];
  events: {
    eventId: number;
    training?: { workout: { steps: unknown[] } };
    activity?: { feedbackQuestions: unknown[]; stream?: unknown };
  }[];
}

describe('AccountExportService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: AccountExportService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new AccountExportService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) {
      await prisma.$executeRawUnsafe(sql);
    }
    await prisma.$executeRawUnsafe(
      `UPDATE event_activity SET stream = '{"heartrate":[120,135]}' WHERE event_activity_id = 3501`,
    );
  });

  async function exportOf(userId: number, includeStreams = false) {
    let text = '';
    let ended = false;
    await service.export(
      userId,
      {
        write: (chunk: string) => (text += chunk),
        end: () => (ended = true),
      },
      { includeStreams },
    );
    expect(ended).toBe(true);
    return { text, data: JSON.parse(text) as ExportDocument };
  }

  it('exports the account as one JSON document', async () => {
    const { data } = await exportOf(USER_ID);

    expect(data.format).toBe(ACCOUNT_EXPORT_FORMAT);
    expect(data.user).toMatchObject({
      email: 'athlete@example.com',
      firstName: 'Ath',
      subscription: { plan: 'ATHLETE_PRO' },
    });
    expect(data.athlete.metrics).toHaveLength(1);
    expect(data.athlete.trainingZones[0].values).toHaveLength(1);
    expect(data.athlete.injuries).toHaveLength(1);
    expect(data.athlete.cycles[0].weeks).toHaveLength(1);
    expect(data.athlete.providerAccounts).toEqual([
      expect.objectContaining({ provider: 'GARMIN', status: 'active' }),
    ]);
    expect(data.coaching.coaches).toEqual([
      expect.objectContaining({ firstName: 'Co', lastName: 'Ach' }),
    ]);
    expect(data.templates[0].event.name).toBe('Template');
    expect(data.aiAssistant[0].messages[0].blocks[0].content).toBe('hi');
    expect(data.aiSettings.keys).toEqual([
      expect.objectContaining({ provider: 'openai', apiKeyHint: '••••1234' }),
    ]);
  });

  it('includes every event with its workout and activity', async () => {
    const { data } = await exportOf(USER_ID);

    expect(data.events.map((event) => event.eventId)).toEqual([
      3001, 3002, 3003, 3004,
    ]);
    const training = data.events[0].training;
    expect(training?.workout.steps.length).toBeGreaterThan(0);
    const activity = data.events[1].activity;
    expect(activity).toMatchObject({ distance: 10000, sport: 'RUNNING' });
    expect(activity?.feedbackQuestions).toHaveLength(1);
    expect(activity?.stream).toBeUndefined();
  });

  it('includes activity streams only when asked', async () => {
    const { data } = await exportOf(USER_ID, true);

    expect(data.events[1].activity?.stream).toEqual({ heartrate: [120, 135] });
  });

  it('only exports the messages the user wrote', async () => {
    const { data } = await exportOf(USER_ID);

    expect(data.messages).toEqual([
      expect.objectContaining({ content: 'Thanks' }),
    ]);
  });

  it('never exports secrets', async () => {
    const { text } = await exportOf(USER_ID, true);

    for (const secret of [
      '"password"',
      '"pushToken"',
      '"accessToken"',
      '"refreshToken"',
      '"encryptedApiKey"',
      'v1:a:b:c',
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("does not contain the coach's own data", async () => {
    const { text } = await exportOf(USER_ID);
    const coach = await exportOf(COACH_USER_ID);

    expect(text).not.toContain('coach@example.com');
    expect(coach.data.events).toEqual([]);
  });

  it('decides, for every table holding user data, whether it is exported', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT DISTINCT tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name IN ('user', 'athlete')`;

    const undecided = tables
      .map((row) => row.table_name)
      .filter(
        (table) =>
          !EXPORTED_TABLES.includes(table) && !(table in NOT_EXPORTED_TABLES),
      );
    expect(undecided).toEqual([]);
  });
});
