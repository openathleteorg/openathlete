/**
 * Seeds the screenshot database with a coach, a fully detailed athlete and a
 * roster, dated relative to today. See README.md.
 *
 *   pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/seed.ts
 *
 * It empties the database first, and refuses to when the database holds
 * accounts it did not create (pass --force to override).
 */
import { createCipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import type { ConnectorProvider, Prisma, PrismaClient, SportType } from '../../libs/database/generated/client';

import { CAMILLE_EMAIL, COACH_EMAIL, DOMAIN, PASSWORD } from './lib/accounts';
import { addDays, at, daysBetween, mondayOf, today as getToday, TIME_ZONE } from './lib/dates';
import { hashSeed, Random } from './lib/random';
import { PENDING_INVITE, ROSTER, RosterAthlete } from './lib/roster';
import { buildSeason, PlannedDay, Race } from './lib/season';
import { Lap, Physiology, record, Recording } from './lib/streams';
import { pace, Session, sessionBlocks, sessionGoals, sessions, workoutCreate } from './lib/workouts';

const ROOT = join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Environment: the screenshot API's, so hashes and keys match it
// ---------------------------------------------------------------------------

function loadEnv(file: string) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^'(.*)'$/s, '$1').replace(/^"(.*)"$/s, '$1');
  }
}
loadEnv(join(__dirname, 'api.env'));

// The API's own dependencies, so the hashes and jobs are the ones it reads
const apiRequire = createRequire(join(ROOT, 'apps', 'api', 'package.json'));
const argon2 = apiRequire('argon2') as {
  hash(plain: string, options: { secret: Buffer }): Promise<string>;
};
interface BullQueue {
  addBulk(jobs: { name: string; data: object; opts?: object }[]): Promise<unknown>;
  close(): Promise<void>;
}
const { Queue } = apiRequire('bullmq') as {
  Queue: new (name: string, options: { connection: { url: string } }) => BullQueue;
};

const PEPPER = process.env.HASH_PEPPER ?? '';

function encryptApiKey(plain: string): string {
  const key = Buffer.from(hkdfSync('sha256', PEPPER, Buffer.alloc(0), 'openathlete/ai-credentials', 32));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

type Db = PrismaClient;
const RIDES: SportType[] = ['CYCLING', 'GRAVEL_RIDE', 'VIRTUAL_RIDE'];

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

async function reset(db: Db, seedEmails: string[]) {
  const foreign = await db.user.count({ where: { email: { notIn: seedEmails } } });
  if (foreign > 0 && !process.argv.includes('--force')) {
    throw new Error(
      `The database holds ${foreign} account(s) this seed did not create. ` +
        'Point DATABASE_URL at the screenshot database, or pass --force to wipe it.',
    );
  }
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

interface Person {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  roles: ('ATHLETE' | 'COACH')[];
  createdDaysAgo: number;
}

const emailOf = (p: { firstName: string; lastName: string }) =>
  `${p.firstName}.${p.lastName}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase() + `@${DOMAIN}`;

async function createAccount(db: Db, person: Person, passwordHash: string, today: Date) {
  const created = addDays(today, -person.createdDaysAgo);
  const user = await db.user.create({
    data: {
      email: emailOf(person),
      password: passwordHash,
      roles: person.roles,
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      onboardingCompleted: true,
      language: 'EN',
      timeZone: TIME_ZONE,
      aiDataSharingConsentAt: created,
      supportReminderDismissedAt: created,
      createdAt: created,
      athlete: { create: { createdAt: created, settings: { create: {} } } },
    },
    include: { athlete: true },
  });
  return { user, athleteId: user.athlete!.athleteId };
}

const HR_ZONE_NAMES = ['Recovery', 'Endurance', 'Tempo', 'Threshold', 'VO2max'];
const ZONE_COLORS = ['#9CA3AF', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#A855F7'];

/** Five heart-rate zones from max and resting heart rate (Karvonen). */
async function createHrZones(db: Db, athleteId: number, hrRest: number, hrMax: number): Promise<number[]> {
  const reserve = hrMax - hrRest;
  const bounds = [0.6, 0.72, 0.8, 0.88, 0.94].map((f) => Math.round(hrRest + reserve * f));
  const ids: number[] = [];
  for (let i = 0; i < 5; i++) {
    const zone = await db.trainingZone.create({
      data: {
        athleteId,
        index: i,
        type: 'HEARTRATE',
        name: `Zone ${i + 1}`,
        description: HR_ZONE_NAMES[i],
        color: ZONE_COLORS[i],
        values: {
          create: [{ min: i === 0 ? 0 : bounds[i - 1] + 1, max: i === 4 ? hrMax : bounds[i], sports: [] }],
        },
      },
    });
    ids.push(zone.trainingZoneId);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

const json = (value: unknown) => value as Prisma.InputJsonValue;

function lapRows(laps: Lap[]): Prisma.ActivitySegmentCreateWithoutEventActivityInput[] {
  return laps.map((lap, i) => ({
    segmentType: 'LAP',
    name: lap.name,
    orderIndex: i,
    startTimeSeconds: Math.round(lap.startTimeSeconds),
    endTimeSeconds: Math.round(lap.endTimeSeconds),
    distance: lap.distance,
    elevationGain: lap.elevationGain,
    movingTime: Math.round(lap.movingTime),
    averageSpeed: lap.averageSpeed,
    maxSpeed: lap.maxSpeed,
    averageCadence: lap.averageCadence || null,
    averageHeartrate: lap.averageHeartrate,
    maxHeartrate: lap.maxHeartrate,
    averageWatts: lap.averageWatts,
    maxWatts: lap.maxWatts,
  }));
}

interface ActivityInput {
  athleteId: number;
  name: string;
  sport: SportType;
  start: Date;
  provider: ConnectorProvider | null;
  externalId: string;
  rpe: number | null;
  description?: string;
  isRace?: boolean;
  equipmentId?: number | null;
  recording?: Recording;
  /** Activities without a recording (strength, the roster) */
  manual?: { distance: number; movingTime: number; averageHeartrate: number; maxHeartrate: number; elevationGain?: number };
  aiSummary?: { headline: string; points: string[]; suggestion: string | null };
  /** Sets done in the session player (strength) */
  strengthLog?: unknown;
}

async function createActivity(db: Db, input: ActivityInput) {
  const s = input.recording?.summary;
  const movingTime = s?.movingTime ?? input.manual?.movingTime ?? 0;
  const distance = s?.distance ?? input.manual?.distance ?? 0;
  const event = await db.event.create({
    data: {
      athleteId: input.athleteId,
      type: 'ACTIVITY',
      name: input.name,
      startDate: input.start,
      endDate: new Date(input.start.getTime() + movingTime * 1000),
      createdAt: new Date(input.start.getTime() + movingTime * 1000 + 600_000),
      activity: {
        create: {
          provider: input.provider,
          externalId: input.externalId,
          sport: input.sport,
          description: input.description ?? '',
          isRace: input.isRace ?? false,
          rpe: input.rpe,
          distance,
          movingTime,
          elevationGain: s?.elevationGain ?? input.manual?.elevationGain ?? 0,
          averageSpeed: s?.averageSpeed ?? (movingTime ? distance / movingTime : 0),
          maxSpeed: s?.maxSpeed ?? (movingTime ? (distance / movingTime) * 1.25 : 0),
          averageHeartrate: s?.averageHeartrate ?? input.manual?.averageHeartrate ?? null,
          maxHeartrate: s?.maxHeartrate ?? input.manual?.maxHeartrate ?? null,
          averageCadence: s?.averageCadence ?? null,
          averageWatts: s?.averageWatts ?? null,
          maxWatts: s?.maxWatts ?? null,
          weightedAverageWatts: s?.weightedAverageWatts ?? null,
          kilojoules: s?.kilojoules ?? null,
          equipmentId: input.equipmentId ?? null,
          stream: input.recording ? json(input.recording.stream) : undefined,
          aiSummary: input.aiSummary ? json(input.aiSummary) : undefined,
          strengthLog: input.strengthLog ? json(input.strengthLog) : undefined,
          aiSummaryAt: input.aiSummary ? new Date(input.start.getTime() + movingTime * 1000 + 900_000) : undefined,
          // Recent activities answered the post-activity questions already
          feedbackSkipped: true,
          segments: input.recording ? { create: lapRows(input.recording.laps) } : undefined,
        },
      },
    },
    include: { activity: true },
  });
  return { eventId: event.eventId, eventActivityId: event.activity!.eventActivityId };
}

async function createPlannedSession(
  db: Db,
  athleteId: number,
  session: Session,
  start: Date,
  zoneIds: number[],
  relatedActivityId: number | null,
  overrides: { name?: string; description?: string } = {},
) {
  const goals = sessionGoals(session);
  const structured = !session.unstructured && session.items.length > 0;
  const event = await db.event.create({
    data: {
      athleteId,
      type: 'TRAINING',
      name: overrides.name ?? session.name,
      startDate: start,
      endDate: new Date(start.getTime() + (session.sport === 'STRENGTH' ? 2700 : goals.duration || 2700) * 1000),
      training: {
        create: {
          sport: session.sport,
          description: overrides.description ?? session.description,
          goalDistance: goals.distance,
          // Sets are not timed in the steps: a strength session plans its hour
          goalDuration: session.sport === 'STRENGTH' ? 2700 : goals.duration || null,
          goalElevationGain: session.goalElevationGain ?? null,
          goalRpe: session.goalRpe,
          relatedActivityId,
          workout: structured ? { create: workoutCreate(session, zoneIds) } : undefined,
        },
      },
    },
  });
  return event.eventId;
}

/** The sets of a strength session as the player records them, one or two reps short now and then */
function strengthLog(session: Session, rng: Random) {
  const sets: unknown[] = [];
  session.items.forEach((item, block) => {
    const steps = 'repeat' in item ? item.steps : [item];
    const rounds = 'repeat' in item ? item.repeat : 1;
    for (let round = 0; round < rounds; round++) {
      steps.forEach((step, index) => {
        const exercise = step.exercise;
        if (!exercise) return;
        const tired = round === rounds - 1 && rng.int(0, 3) === 0;
        sets.push({
          key: `b${block}.r${round}.e${index}`,
          exerciseRef: `c:${exercise.id}`,
          name: step.name ?? exercise.id,
          reps: exercise.reps ? exercise.reps - (tired ? 1 : 0) : null,
          seconds: exercise.reps ? null : (step.duration ?? null),
          load: exercise.load ?? null,
          skipped: false,
        });
      });
    }
  });
  return { version: 1, sets, amrapRounds: {} };
}

// ---------------------------------------------------------------------------
// Camille
// ---------------------------------------------------------------------------

const CAMILLE: Physiology = { hrRest: 46, hrMax: 191, thresholdSpeed: pace('3:55'), ftp: 215, massKg: 57 };

function activityName(session: Session, hour: number): string {
  const r = session.routes[0];
  if (session.sport === 'STRENGTH') return 'Strength';
  if (RIDES.includes(session.sport)) return hour < 12 ? 'Morning Ride' : 'Afternoon Ride';
  if (r === 'semnoz') return 'Quintal Trail Running';
  if (r === 'tournette') return 'Talloires-Montmin Trail Running';
  if (r === 'mont-veyrier') return 'Veyrier-du-Lac Trail Running';
  if (r === 'cret-du-maure') return 'Annecy Trail Running';
  return 'Annecy Running';
}

const SUMMARIES: Record<string, ActivityInput['aiSummary']> = {
  intervals: {
    headline: 'Your most even set of 1000 m reps this block: 3:41 average, only 3 seconds between fastest and slowest.',
    points: [
      'Heart rate reached zone 5 from the third rep and recovered below 140 bpm within each 2-minute jog.',
      'Cadence stayed at 182-186 spm on every rep: no sign of form fading at the end.',
      'Compared with the same session six weeks ago, the reps are 4 s/km faster for the same heart rate.',
    ],
    suggestion: 'Keep tomorrow fully easy: 40 minutes in zone 1-2, or rest if the calf still feels tight.',
  },
  longRoad: {
    headline: 'Textbook marathon-pace finish: the last 6 km at 4:27/km average, with heart rate still in zone 3.',
    points: [
      'The first 20 km stayed in zone 2 with only 3 % cardiac drift, a sign your aerobic base is solid.',
      'Cadence held at 178-182 spm through the faster finish: no form fading.',
      'Weekly load reached 640 TRIMP, the top of this block. Form sits at -18, productive fatigue.',
    ],
    suggestion: 'Recovery week ahead: keep everything in zone 1-2 and sleep 8 hours where you can.',
  },
  long: {
    headline: 'Four hours on the Semnoz with 2,300 m of climbing, and your heart rate never left zone 3: a solid SaintéLyon rehearsal.',
    points: [
      'Grade-adjusted pace held at 5:54/km from start to finish, with only 3 % cardiac drift over the last hour.',
      'You power-hiked the steep ramps above Quintal at about 800 m/h without spiking your heart rate.',
      'Fuelling every 40 minutes worked: no drop in pace after the third hour.',
    ],
    suggestion: 'Next long run, start by headlamp and run the first 10 km at race effort to rehearse the night start.',
  },
  race: {
    headline: '37:49 over 10 km: a personal best by 47 seconds, with a negative split.',
    points: [
      'First 5 km in 18:58, second in 18:51. You held 177 bpm without fading.',
      'Your critical speed estimate rises to 4.30 m/s, matching a VMA of about 17.6 km/h.',
      'Training load fell 18 % over the previous 10 days: the mini-taper worked.',
    ],
    suggestion: null,
  },
};

interface CamilleIds {
  athleteId: number;
  userId: number;
  zoneIds: number[];
  activities: { eventActivityId: number; eventId: number; showcase: boolean }[];
  lastLongRunActivityId: number | null;
}

async function seedCamille(db: Db, today: Date, coachUserId: number, passwordHash: string): Promise<CamilleIds> {
  const { user, athleteId } = await createAccount(
    db,
    { firstName: 'Camille', lastName: 'Laurent', gender: 'FEMALE', roles: ['ATHLETE'], createdDaysAgo: 420 },
    passwordHash,
    today,
  );
  await db.coachAthlete.create({ data: { userId: coachUserId, athleteId, createdAt: addDays(today, -400) } });
  await db.coachActivityAlertSettings.create({
    data: { coachUserId, athleteId, notifyComments: true, notifyRpe: true, notifyNewActivities: true },
  });

  // Zones: heart rate (lab test in September), running pace, cycling power
  const zoneIds = await createHrZones(db, athleteId, CAMILLE.hrRest, CAMILLE.hrMax);
  const paceZones = [
    ['Easy', 0, pace('5:45')], ['Endurance', pace('5:45'), pace('4:50')], ['Marathon', pace('4:50'), pace('4:20')],
    ['Threshold', pace('4:20'), pace('3:50')], ['VO2max', pace('3:50'), pace('3:05')],
  ] as const;
  for (const [i, [name, min, max]] of paceZones.entries()) {
    await db.trainingZone.create({
      data: {
        athleteId, index: i, type: 'PACE', name: `Zone ${i + 1}`, description: name, color: ZONE_COLORS[i],
        values: { create: [{ min, max, sports: ['RUNNING', 'TRAIL_RUNNING'] }] },
      },
    });
  }
  const ftp = CAMILLE.ftp;
  const powerZones = [
    ['Active recovery', 0, 0.55], ['Endurance', 0.55, 0.75], ['Tempo', 0.75, 0.9],
    ['Threshold', 0.9, 1.05], ['VO2max', 1.05, 1.2], ['Anaerobic', 1.2, 1.6],
  ] as const;
  for (const [i, [name, lo, hi]] of powerZones.entries()) {
    await db.trainingZone.create({
      data: {
        athleteId, index: i, type: 'POWER', name: `Zone ${i + 1}`, description: name, color: ZONE_COLORS[i],
        values: { create: [{ min: Math.round(ftp * lo), max: Math.round(ftp * hi), sports: RIDES }] },
      },
    });
  }

  // Gear
  const shoes = {
    road: await db.equipment.create({ data: { athleteId, name: 'ASICS Novablast 5', type: 'SHOE', sports: ['RUNNING'], isDefault: true } }),
    race: await db.equipment.create({ data: { athleteId, name: 'Nike Vaporfly 3', type: 'SHOE', sports: ['RUNNING'] } }),
    trail: await db.equipment.create({ data: { athleteId, name: 'HOKA Speedgoat 6', type: 'SHOE', sports: ['TRAIL_RUNNING'], isDefault: true } }),
    bike: await db.equipment.create({ data: { athleteId, name: 'Canyon Endurace CF 7', type: 'BIKE', sports: RIDES, isDefault: true } }),
  };

  // Devices: runs from the watch (Garmin), rides through Strava
  for (const [provider, days] of [['GARMIN', 400], ['STRAVA', 410]] as const) {
    await db.providerAccount.create({
      data: {
        athleteId, provider, status: 'active',
        accessToken: `screenshots-${provider.toLowerCase()}-token`, refreshToken: 'screenshots-refresh',
        externalUserId: String(hashSeed(provider + athleteId)),
        importActivitiesEnabled: true, exportWorkoutsEnabled: provider === 'GARMIN', importMetricsEnabled: provider === 'GARMIN',
        fullImportRequestedAt: addDays(today, -days), fullImportCompletedAt: addDays(today, -days),
        createdAt: addDays(today, -days),
      },
    });
  }

  // Health metrics, every day for a year
  await seedCamilleMetrics(db, athleteId, today);

  const season = buildSeason(today);
  const rng = new Random(42);
  const activities: CamilleIds['activities'] = [];
  let lastLongRunActivityId: number | null = null;
  const distances = new Map<number, number>();
  const addDistance = (id: number, m: number) => distances.set(id, (distances.get(id) ?? 0) + m);

  // The current week tells a story: a bad night and a tight calf on Tuesday,
  // so the coach swapped the intervals for an easy run and moved them.
  const story = new Map<number, { session: Session; name?: string; description?: string }>([
    [today.getTime(), {
      session: sessions.recovery(40),
      name: "Easy 40' + calf mobility",
      description: 'Changed by Julien: bad night and tight left calf. Flat, zone 1, stop if the calf hurts. Then 15 minutes of mobility and eccentric calf raises.',
    }],
    [addDays(today, 2).getTime(), {
      session: sessions.intervals1000(6),
      description: 'Moved from Tuesday. Only if the calf is pain-free on the warm-up, otherwise 45 minutes easy.',
    }],
  ]);

  const days: PlannedDay[] = season.days.map((d) => {
    const s = story.get(d.day.getTime());
    return s ? { ...d, session: s.session } : d;
  });

  let externalSeq = 18_000_000_000;
  const recentFrom = addDays(today, -21);
  for (const d of days) {
    const start = at(d.day, d.hour, d.minute + rng.int(-8, 8));
    let activity: { eventId: number; eventActivityId: number } | null = null;
    if (d.executed) {
      const ride = RIDES.includes(d.session.sport);
      const strength = d.session.sport === 'STRENGTH';
      const recording = strength
        ? undefined
        : record({
            kind: ride ? 'ride' : 'run',
            routes: d.session.routes,
            blocks: sessionBlocks(d.session),
            athlete: CAMILLE,
            rng: new Random(hashSeed(d.day.toISOString())),
            autoLapMeters: ride ? 5000 : d.session.unstructured ? 1000 : undefined,
            strain: d.strain,
          });
      const isLong = d.session.name.startsWith('Long run') || d.session.name.startsWith('Semnoz');
      const longSummary = d.session.sport === 'TRAIL_RUNNING' ? SUMMARIES.long : SUMMARIES.longRoad;
      const isIntervals = d.session.name.includes('× 1000');
      const showcase = d.day >= recentFrom;
      const equipment = ride ? shoes.bike : d.session.sport === 'TRAIL_RUNNING' ? shoes.trail : strength ? null : shoes.road;
      activity = await createActivity(db, {
        athleteId,
        name: activityName(d.session, d.hour),
        sport: d.session.sport,
        start,
        // A strength session is recorded by the player, not imported
        provider: strength ? null : ride ? 'STRAVA' : 'GARMIN',
        externalId: strength ? `player-${externalSeq++}` : String(externalSeq++),
        rpe: Math.round(d.rpe * 10) / 10,
        equipmentId: equipment?.equipmentId ?? null,
        recording,
        manual: strength ? { distance: 0, movingTime: 2700 + rng.int(-300, 300), averageHeartrate: 112, maxHeartrate: 148 } : undefined,
        aiSummary: showcase && isIntervals ? SUMMARIES.intervals : showcase && isLong ? longSummary : undefined,
        // Its own randomness: the rest of the seed draws the same numbers as before
        strengthLog: strength ? strengthLog(d.session, new Random(hashSeed(`log-${d.day.toISOString()}`))) : undefined,
      });
      if (equipment && recording) addDistance(equipment.equipmentId, recording.summary.distance);
      activities.push({ ...activity, showcase });
      if (isLong) lastLongRunActivityId = activity.eventActivityId;
    }
    if (d.planned) {
      const s = story.get(d.day.getTime());
      await createPlannedSession(db, athleteId, d.session, start, zoneIds, activity?.eventActivityId ?? null, {
        name: s?.name,
        description: s?.description,
      });
    }
  }

  // Races: the competition, and its result for the past ones
  for (const race of season.races) {
    await createRace(db, athleteId, race, today, externalSeq++, activities, shoes.race.equipmentId, shoes.trail.equipmentId, addDistance);
  }

  for (const [equipmentId, distance] of distances) {
    await db.equipment.update({ where: { equipmentId }, data: { totalDistance: distance } });
  }

  // Training blocks and periods off
  for (const p of season.periods) {
    await db.cycle.create({
      data: {
        athleteId, name: p.name, description: p.description, startDate: p.start, endDate: p.end,
        kind: p.kind, phase: p.phase, color: p.color,
      },
    });
  }

  // Calendar notes
  const notes: [number, string, string][] = [
    [1, 'Physio', 'Left calf check with Marion, 12:30. Bring the running shoes.'],
    [9, 'Course recce', 'Recce of the last 25 km of the SaintéLyon with the club: Soucieu to Lyon. Bring the headlamp.'],
    [24, 'Race kit check', 'Headlamp 900 lm + spare battery, waterproof jacket, 2 × 500 ml soft flasks, 8 gels, cup.'],
  ];
  for (const [offset, name, description] of notes) {
    const day = addDays(today, offset);
    await db.event.create({
      data: {
        athleteId, type: 'NOTE', name, startDate: at(day, 12, 30), endDate: at(day, 13, 30),
        note: { create: { description } },
      },
    });
  }

  // The calf, as the post-activity feedback would have recorded it
  await db.athleteInjury.create({
    data: {
      athleteId, location: 'Left calf', painScore: 3, status: 'IMPROVING',
      context: 'Tightness after the weekend run, no pain when walking. Same leg as the June soleus strain.',
      sourceActivityId: lastLongRunActivityId,
      createdAt: addDays(today, -2), updatedAt: today,
    },
  });

  return { athleteId, userId: user.userId, zoneIds, activities, lastLongRunActivityId };
}

async function createRace(
  db: Db,
  athleteId: number,
  race: Race,
  today: Date,
  externalId: number,
  activities: CamilleIds['activities'],
  roadShoeId: number,
  trailShoeId: number,
  addDistance: (id: number, m: number) => void,
) {
  const start = at(race.day, race.hour, race.hour === 23 ? 30 : 0);
  let relatedActivityId: number | null = null;
  if (race.result && race.day < today) {
    const trail = race.sport === 'TRAIL_RUNNING';
    const recording = record({
      kind: 'run',
      routes: race.result.routes,
      blocks: race.result.blocks,
      athlete: CAMILLE,
      rng: new Random(hashSeed(race.name)),
      autoLapMeters: trail ? 5000 : 1000,
      strain: 1.035,
    });
    const shoe = trail ? trailShoeId : roadShoeId;
    const activity = await createActivity(db, {
      athleteId, name: race.result.activityName, sport: race.sport, start, provider: 'GARMIN',
      externalId: String(externalId), rpe: race.result.rpe, description: race.result.notes, isRace: true,
      equipmentId: shoe, recording,
      aiSummary: race.distance === 10000 ? SUMMARIES.race : undefined,
    });
    addDistance(shoe, recording.summary.distance);
    activities.push({ ...activity, showcase: daysBetween(race.day, today) < 40 });
    relatedActivityId = activity.eventActivityId;
    // Race PBs stand out from her training efforts: she vouched for them
    if (race.priority !== 'B') {
      await db.athleteSettings.update({
        where: { athleteId },
        data: { dismissedRecordSuspects: { push: activity.eventActivityId } },
      });
    }
  }
  await db.event.create({
    data: {
      athleteId, type: 'COMPETITION', name: race.name, startDate: start,
      endDate: new Date(start.getTime() + 4 * 3600_000),
      competition: {
        create: {
          sport: race.sport, description: race.description, goalDistance: race.distance,
          goalElevationGain: race.elevation, priority: race.priority, goalRpe: 0.9, relatedActivityId,
          goalDuration: race.name === 'SaintéLyon' ? 9 * 3600 : null,
        },
      },
    },
  });
}

async function seedCamilleMetrics(db: Db, athleteId: number, today: Date) {
  const rng = new Random(7);
  const rows: Prisma.AthleteMetricCreateManyInput[] = [];
  const add = (day: Date, type: Prisma.AthleteMetricCreateManyInput['type'], value: number) =>
    rows.push({ athleteId, date: day, type, value: Math.round(value * 10) / 10 });
  let weight = 58.4;
  let hrv = 62;
  for (let i = 365; i >= 0; i--) {
    const day = addDays(today, -i);
    const progress = 1 - i / 365;
    const ill = i <= 290 && i >= 286 ? 1 : 0;
    // Story: last night was short and restless
    const badNight = i === 0;
    hrv = hrv * 0.6 + (60 + 6 * progress + rng.normal(0, 5) - ill * 18) * 0.4;
    add(day, 'HRV_LAST_NIGHT_AVG', badNight ? 41 : hrv);
    add(day, 'HR_REST', badNight ? 55 : 48 - 2 * progress + rng.normal(0, 1.2) + ill * 9);
    const sleep = badNight ? 4.8 : Math.min(9.2, Math.max(5.6, rng.normal(7.5, 0.55)));
    add(day, 'SLEEP_DURATION', sleep);
    add(day, 'SLEEP_SCORE', badNight ? 41 : Math.min(97, Math.max(52, 55 + (sleep - 6) * 15 + rng.normal(0, 4))));
    add(day, 'DAILY_STEPS', Math.round(rng.normal(11500, 2800)));
    if (i % 3 === 0) {
      weight += rng.normal(0, 0.18) + (58.0 - weight) * 0.08;
      add(day, 'WEIGHT', weight);
    }
    if (i % 30 === 0) {
      add(day, 'VO2MAX', 54.5 + 2.5 * progress + rng.normal(0, 0.3));
      add(day, 'BODY_FAT', 17.5 - 1.2 * progress + rng.normal(0, 0.2));
    }
  }
  // Capacities: field tests through the season
  const tests: [number, Prisma.AthleteMetricCreateManyInput['type'], number][] = [
    [330, 'VMA', 16.8], [200, 'VMA', 17.3], [45, 'VMA', 17.6],
    [300, 'FTP_CYCLING', 198], [150, 'FTP_CYCLING', 209], [40, 'FTP_CYCLING', 215],
    [365, 'HR_MAX', 190], [60, 'HR_MAX', 191],
    [120, 'CRITICAL_POWER_RUNNING', 4.1], [30, 'CRITICAL_POWER_RUNNING', 4.3],
  ];
  for (const [ago, type, value] of tests) add(addDays(today, -ago), type, value);
  await db.athleteMetric.createMany({ data: rows, skipDuplicates: true });
}

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

async function seedRosterAthlete(
  db: Db,
  spec: RosterAthlete,
  index: number,
  today: Date,
  coachUserId: number,
  passwordHash: string,
  queueIds: { eventActivityId: number; eventId: number }[],
) {
  const rng = new Random(hashSeed(spec.lastName));
  const { user, athleteId } = await createAccount(
    db,
    { ...spec, gender: spec.gender === 'FEMALE' ? 'FEMALE' : 'MALE', roles: ['ATHLETE'], createdDaysAgo: 120 + index * 23 },
    passwordHash,
    today,
  );
  await db.coachAthlete.create({ data: { userId: coachUserId, athleteId, createdAt: addDays(today, -100 - index * 17) } });
  const zoneIds = await createHrZones(db, athleteId, spec.hrRest, spec.hrMax);
  await db.providerAccount.create({
    data: {
      athleteId, provider: spec.provider, status: 'active', accessToken: 'screenshots-token',
      externalUserId: String(hashSeed(spec.lastName)), importActivitiesEnabled: true, exportWorkoutsEnabled: false,
      fullImportRequestedAt: addDays(today, -100), fullImportCompletedAt: addDays(today, -100),
    },
  });
  const metrics: Prisma.AthleteMetricCreateManyInput[] = [
    { athleteId, type: 'HR_MAX', value: spec.hrMax, date: addDays(today, -110) },
    { athleteId, type: 'HR_REST', value: spec.hrRest, date: addDays(today, -110) },
  ];
  for (let i = 0; i < 30; i++) {
    metrics.push({ athleteId, type: 'HRV_LAST_NIGHT_AVG', value: Math.round(rng.normal(58, 7)), date: addDays(today, -i) });
    metrics.push({ athleteId, type: 'SLEEP_DURATION', value: Math.round(rng.normal(7.3, 0.6) * 10) / 10, date: addDays(today, -i) });
  }
  await db.athleteMetric.createMany({ data: metrics, skipDuplicates: true });

  // Ten weeks of training, then a planned fortnight around today
  const pattern = [1, 2, 3, 4, 5, 6, 0, 2, 5, 3].slice(0, Math.min(7, spec.frequency));
  const extra = Math.max(0, spec.frequency - 7);
  const lastActive = addDays(today, -(spec.quietDays ?? 0));
  const planFrom = addDays(today, -7);
  for (let monday = mondayOf(addDays(today, -70)); monday <= addDays(today, 14); monday = addDays(monday, 7)) {
    const slots = [...pattern, ...pattern.slice(0, extra)];
    for (const [k, dow] of slots.entries()) {
      const day = addDays(monday, dow);
      const sport = k === 0 ? spec.sports[0] : spec.sports[k % spec.sports.length];
      const long = dow === 6 || (dow === 5 && k === slots.length - 1);
      const hour = dow >= 5 ? 9 : k >= 7 ? 7 : 18;
      const start = at(day, hour, rng.int(0, 45));
      const session = rosterSession(sport, long, rng);
      const done = day < lastActive && day < today && (day < planFrom || rng.chance(spec.compliance));
      let activityId: number | null = null;
      if (done) {
        const goals = sessionGoals(session);
        const speedFactor = rng.range(0.96, 1.04);
        const ride = RIDES.includes(sport);
        const swim = sport === 'SWIMMING';
        const speed = swim ? 1.1 : ride ? 7.6 : spec.runSpeed * (sport === 'TRAIL_RUNNING' || sport === 'HIKING' ? 0.78 : 1);
        const movingTime = Math.round((goals.duration || 3600) * rng.range(0.92, 1.08));
        const avgHr = Math.round(spec.hrRest + (spec.hrMax - spec.hrRest) * (session.goalRpe > 0.6 ? 0.78 : 0.66) + rng.normal(0, 3));
        const a = await createActivity(db, {
          athleteId,
          name: rosterActivityName(sport, hour),
          sport,
          start,
          provider: spec.provider,
          externalId: `${spec.provider.toLowerCase()}-${athleteId}-${day.getTime()}-${k}`,
          rpe: Math.round((session.goalRpe + rng.normal(0, 0.05)) * 10) / 10,
          manual: {
            distance: Math.round(movingTime * speed * speedFactor),
            movingTime,
            averageHeartrate: avgHr,
            maxHeartrate: avgHr + rng.int(12, 22),
            elevationGain: sport === 'TRAIL_RUNNING' || sport === 'HIKING' ? rng.int(400, 1200) : ride ? rng.int(200, 900) : rng.int(20, 120),
          },
        });
        activityId = a.eventActivityId;
        queueIds.push(a);
      }
      if (day >= planFrom) {
        await createPlannedSession(db, athleteId, session, start, zoneIds, activityId);
      }
    }
  }

  if (spec.injury) {
    await db.athleteInjury.create({
      data: { athleteId, ...spec.injury, status: 'IMPROVING', createdAt: addDays(today, -6), updatedAt: addDays(today, -1) },
    });
  }
  if (spec.unread) {
    // Titles as the API writes them: participants by user id, or the activity
    const thread = await db.messageThread.create({
      data: { title: `Julien Moreau, ${spec.firstName} ${spec.lastName}`, participants: { create: [{ userId: user.userId, lastReadAt: today }, { userId: coachUserId, lastReadAt: addDays(today, -3) }] } },
    });
    await db.message.create({
      data: { messageThreadId: thread.messageThreadId, senderId: user.userId, content: spec.unread, createdAt: at(today, 7, 12 + index) },
    });
  }
  await db.subscription.create({ data: { userId: user.userId, plan: 'FREE', status: 'active' } });
}

function rosterSession(sport: SportType, long: boolean, rng: Random): Session {
  switch (sport) {
    case 'CYCLING':
    case 'GRAVEL_RIDE':
      return long
        ? { ...sessions.bikeEndurance(180), sport }
        : rng.chance(0.5) ? { ...sessions.sweetSpot(), sport } : { ...sessions.bikeEndurance(75), sport };
    case 'SWIMMING':
      return {
        name: rng.chance(0.5) ? 'Swim: 10 × 100 m' : 'Swim endurance 2,500 m',
        sport,
        description: 'Technique drills in the warm-up, then the main set at steady effort.',
        items: [
          { type: 'WARMUP', distance: 400 },
          { repeat: 10, steps: [{ type: 'INTERVAL_ACTIVE', name: '100 m', distance: 100 }, { type: 'INTERVAL_REST', name: 'Rest', duration: 20 }] },
          { type: 'COOLDOWN', distance: 200 },
        ],
        routes: [],
        goalDistance: 2500,
        goalRpe: 0.55,
      };
    case 'TRAIL_RUNNING':
      return long
        ? sessions.trailLong('semnoz', 22, 1300, 'Long trail run')
        : rng.chance(0.5) ? sessions.hills(8) : sessions.easy(10, 'albigny-loop');
    case 'HIKING':
      return { ...sessions.trailLong('tournette', 14, 1100, 'Mountain hike'), sport, goalRpe: 0.4 };
    default:
      return long
        ? sessions.longRun(rng.int(16, 24))
        : rng.pick([sessions.intervals1000(5), sessions.threshold(4), sessions.easy(10), sessions.easy(8), sessions.tempo()]);
  }
}

function rosterActivityName(sport: SportType, hour: number): string {
  const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  if (RIDES.includes(sport)) return `${part} Ride`;
  if (sport === 'SWIMMING') return 'Pool Swim';
  if (sport === 'TRAIL_RUNNING') return `${part} Trail Run`;
  if (sport === 'HIKING') return `${part} Hike`;
  return `${part} Run`;
}

// ---------------------------------------------------------------------------
// Conversations, templates, AI settings, subscriptions
// ---------------------------------------------------------------------------

async function seedConversation(db: Db, today: Date, camilleUserId: number, coachUserId: number, longRunActivityId: number | null) {
  const thread = await db.messageThread.create({
    data: {
      title: 'Julien Moreau, Camille Laurent',
      participants: {
        create: [{ userId: camilleUserId, lastReadAt: at(today, 9) }, { userId: coachUserId, lastReadAt: at(today, 9) }],
      },
    },
  });
  const messages: [number, number, number, number, string][] = [
    [-5, 18, 2, coachUserId, 'Great job on the 1000s last week. Saturday night run: try the full race kit, headlamp included.'],
    [-5, 21, 40, camilleUserId, 'Will do! The new headlamp is so much better than the old one.'],
    [0, 7, 34, camilleUserId, 'Morning Julien. Rough night, barely 5 hours, and my left calf is tight since Sunday. Not painful walking, but I can feel it on the stairs. Should I still do the 6 × 1000 tonight?'],
    [0, 8, 5, coachUserId, "Thanks for telling me early. Your HRV is at 41 this morning, well under your usual 64, so no intensity today. I've changed tonight to 40' easy in zone 1 plus calf mobility, and moved the 1000s to Thursday."],
    [0, 8, 7, coachUserId, "Rule for Thursday: if the calf is still there after the warm-up, switch to 45' easy. We have a month to the SaintéLyon, one session doesn't matter, a strain would."],
    [0, 8, 21, camilleUserId, 'Makes sense, thank you. I booked Marion (physio) for tomorrow just in case.'],
  ];
  for (const [offset, h, m, senderId, content] of messages) {
    const createdAt = at(addDays(today, offset), h, m);
    const message = await db.message.create({
      data: { messageThreadId: thread.messageThreadId, senderId, content, createdAt },
    });
    const reader = senderId === coachUserId ? camilleUserId : coachUserId;
    await db.messageReadReceipt.create({ data: { messageId: message.messageId, userId: reader, readAt: createdAt } });
  }

  if (longRunActivityId) {
    const activity = await db.eventActivity.findUniqueOrThrow({ where: { eventActivityId: longRunActivityId }, include: { event: true } });
    const comments = await db.messageThread.create({
      data: {
        title: activity.event.name,
        eventActivityId: longRunActivityId,
        participants: { create: [{ userId: camilleUserId }, { userId: coachUserId }] },
      },
    });
    const base = activity.event.endDate.getTime();
    await db.message.createMany({
      data: [
        { messageThreadId: comments.messageThreadId, senderId: coachUserId, createdAt: new Date(base + 3 * 3600_000), content: 'Very well paced, look at how flat your heart rate stays on the second half. That is the SaintéLyon engine.' },
        { messageThreadId: comments.messageThreadId, senderId: camilleUserId, createdAt: new Date(base + 4 * 3600_000), content: 'Felt easy until the last climb. Gels every 40 minutes worked great.' },
      ],
    });
  }
}

async function seedTemplates(db: Db, userId: number, zoneIds: number[], today: Date) {
  const folders = {
    quality: await db.eventTemplateFolder.create({ data: { userId, name: 'Running · Quality', color: '#ef4444', description: 'Intervals, threshold and tempo' } }),
    endurance: await db.eventTemplateFolder.create({ data: { userId, name: 'Running · Endurance', color: '#22c55e', description: 'Easy and long runs' } }),
    trail: await db.eventTemplateFolder.create({ data: { userId, name: 'Trail & mountain', color: '#16a34a', description: '' } }),
    bike: await db.eventTemplateFolder.create({ data: { userId, name: 'Cycling', color: '#3b82f6', description: '' } }),
    strength: await db.eventTemplateFolder.create({ data: { userId, name: 'Strength & mobility', color: '#a855f7', description: '' } }),
  };
  const items: [Session, number | null][] = [
    [sessions.intervals1000(6), folders.quality.eventTemplateFolderId],
    [sessions.intervals400(12), folders.quality.eventTemplateFolderId],
    [sessions.threshold(5), folders.quality.eventTemplateFolderId],
    [sessions.tempo(), folders.quality.eventTemplateFolderId],
    [sessions.marathonPace(), folders.quality.eventTemplateFolderId],
    [sessions.easy(10), folders.endurance.eventTemplateFolderId],
    [sessions.recovery(40), folders.endurance.eventTemplateFolderId],
    [sessions.longRun(28, 8), folders.endurance.eventTemplateFolderId],
    [sessions.hills(10), folders.trail.eventTemplateFolderId],
    [sessions.trailLong('semnoz', 26, 1900, 'Long trail, back-to-back day 1'), folders.trail.eventTemplateFolderId],
    [sessions.sweetSpot(), folders.bike.eventTemplateFolderId],
    [sessions.bikeEndurance(120), folders.bike.eventTemplateFolderId],
    [sessions.strength(), folders.strength.eventTemplateFolderId],
  ];
  for (const [session, folderId] of items) {
    const goals = sessionGoals(session);
    const structured = !session.unstructured && session.items.length > 0;
    await db.eventTemplate.create({
      data: {
        user: { connect: { userId } },
        folder: folderId ? { connect: { eventTemplateFolderId: folderId } } : undefined,
        event: {
          create: {
            type: 'TRAINING', name: session.name, startDate: at(today, 9), endDate: at(today, 10),
            training: {
              create: {
                sport: session.sport, description: session.description, goalDistance: goals.distance,
                goalDuration: goals.duration || 2700, goalRpe: session.goalRpe,
                workout: structured ? { create: workoutCreate(session, zoneIds) } : undefined,
              },
            },
          },
        },
      },
    });
  }
}

async function seedAiSettings(db: Db, userId: number, today: Date) {
  const anthropic = await db.aiCredential.create({
    data: {
      userId, provider: 'anthropic', label: 'Personal Anthropic key',
      encryptedApiKey: encryptApiKey('sk-ant-screenshots-placeholder-7Qx2'), apiKeyHint: '••••7Qx2',
      lastUsedAt: at(today, 8, 12), createdAt: addDays(today, -60),
    },
  });
  const openai = await db.aiCredential.create({
    data: {
      userId, provider: 'openai', label: 'OpenAI',
      encryptedApiKey: encryptApiKey('sk-proj-screenshots-placeholder-k9Lm'), apiKeyHint: '••••k9Lm',
      lastUsedAt: addDays(today, -1), createdAt: addDays(today, -45),
    },
  });
  await db.aiModelPreference.createMany({
    data: [
      { userId, task: 'DEFAULT', modelId: 'claude-sonnet-5-5', aiCredentialId: anthropic.aiCredentialId },
      { userId, task: 'EVENT_GENERATION', modelId: 'claude-opus-5-5', aiCredentialId: anthropic.aiCredentialId },
      { userId, task: 'ACTIVITY_SUMMARY', modelId: 'claude-haiku-5-5', aiCredentialId: anthropic.aiCredentialId },
      { userId, task: 'POST_ACTIVITY_QUESTIONS', modelId: 'gpt-5.4-mini', aiCredentialId: openai.aiCredentialId },
    ],
  });
  const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  await db.aiUsage.createMany({
    data: [
      { userId, month, task: 'ACTIVITY_SUMMARY', source: 'OWN_KEY', inputTokens: 48_200, outputTokens: 6_900, calls: 4 },
      { userId, month, task: 'EVENT_GENERATION', source: 'OWN_KEY', inputTokens: 31_500, outputTokens: 12_400, calls: 2 },
      { userId, month, task: 'POST_ACTIVITY_QUESTIONS', source: 'OWN_KEY', inputTokens: 9_800, outputTokens: 1_300, calls: 3 },
    ],
  });
}

async function seedSupporter(db: Db, userId: number, interval: 'month' | 'year', today: Date, sinceDays: number) {
  const start = addDays(today, -(sinceDays % (interval === 'month' ? 30 : 365)));
  await db.subscription.create({
    data: {
      userId, plan: 'SUPPORTER', billingInterval: interval, status: 'active', provider: 'stripe',
      currentPeriodStart: start, currentPeriodEnd: addDays(start, interval === 'month' ? 30 : 365),
      createdAt: addDays(today, -sinceDays),
    },
  });
}

/**
 * Waits until the API processed the activities: each one with a heart rate
 * has its training load. A queue that looks empty is not enough, the last
 * jobs may still be running.
 */
async function waitForProcessing(db: Db, log: (msg: string) => void) {
  const pending = () => db.eventActivity.count({
    where: { averageHeartrate: { not: null }, trainingLoadEntries: { none: { calculation: { type: 'TRIMP' } } } },
  });
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 200; i++) {
    const left = await pending();
    // A few may fail for good (concurrent jobs racing to create the same row)
    stable = left === last ? stable + 1 : 0;
    if (left === 0 || (left < 10 && stable >= 5)) {
      log(`processing done (${left} without training load)`);
      return;
    }
    last = left;
    await new Promise((r) => setTimeout(r, 3000));
  }
  log('processing still running; wait before capturing');
}

// ---------------------------------------------------------------------------

async function main() {
  const today = getToday();
  const { prisma: db } = (await import('../../libs/database/client')) as { prisma: Db };
  const seedEmails = [CAMILLE_EMAIL, COACH_EMAIL, ...ROSTER.map(emailOf)];
  await reset(db, seedEmails);

  const passwordHash = await argon2.hash(PASSWORD, { secret: Buffer.from(PEPPER) });
  const log = (msg: string) => console.log(`[seed] ${msg}`); // eslint-disable-line no-console

  const coach = await createAccount(
    db,
    { firstName: 'Julien', lastName: 'Moreau', gender: 'MALE', roles: ['ATHLETE', 'COACH'], createdDaysAgo: 540 },
    passwordHash,
    today,
  );
  const coachZones = await createHrZones(db, coach.athleteId, 50, 185);
  await db.athleteMetric.createMany({
    data: [
      { athleteId: coach.athleteId, type: 'HR_MAX', value: 185, date: addDays(today, -200) },
      { athleteId: coach.athleteId, type: 'HR_REST', value: 50, date: addDays(today, -200) },
    ],
  });
  await seedSupporter(db, coach.user.userId, 'year', today, 300);
  await seedTemplates(db, coach.user.userId, coachZones, today);
  log('coach ready');

  const camille = await seedCamille(db, today, coach.user.userId, passwordHash);
  await seedSupporter(db, camille.userId, 'month', today, 200);
  await seedAiSettings(db, camille.userId, today);
  await seedTemplates(db, camille.userId, camille.zoneIds, today);
  await seedConversation(db, today, camille.userId, coach.user.userId, camille.lastLongRunActivityId);
  log(`Camille: ${camille.activities.length} activities`);

  const rosterActivities: { eventActivityId: number; eventId: number }[] = [];
  for (const [i, spec] of ROSTER.entries()) {
    await seedRosterAthlete(db, spec, i, today, coach.user.userId, passwordHash, rosterActivities);
  }
  await db.athleteInvitation.create({ data: { email: PENDING_INVITE.email, userId: coach.user.userId, status: null, token: randomBytes(16).toString('hex') } });
  log(`roster: ${ROSTER.length} athletes, ${rosterActivities.length} activities`);

  // Hand the activities to the API's processing pipeline: records, grade
  // adjusted pace, intensity, training load. The most recent ones go without
  // bulkImport so they also get their weather.
  const queue = new Queue('activity-processing', { connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6380' } });
  const jobs = [...camille.activities, ...rosterActivities.map((a) => ({ ...a, showcase: false }))].map((a) => ({
    name: 'process',
    data: { eventActivityId: a.eventActivityId, eventId: a.eventId, bulkImport: !a.showcase },
    opts: { removeOnComplete: true, removeOnFail: 100, attempts: 2 },
  }));
  await queue.addBulk(jobs);
  await queue.close();
  log(`${jobs.length} activities queued for processing (needs the API running with ENABLE_ACTIVITY_PROCESSING=true)`);
  await waitForProcessing(db, log);
  // Processing may have called the AI providers with the placeholder keys:
  // the settings would show them as rejected
  await db.aiCredential.updateMany({ data: { lastError: null, lastErrorAt: null } });

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err); // eslint-disable-line no-console
  process.exitCode = 1;
});
