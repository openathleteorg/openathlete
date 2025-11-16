import "dotenv/config";
import { prisma } from "../client";

type Sport =
  | "RUNNING"
  | "CYCLING"
  | "SWIMMING"
  | "TRAIL_RUNNING"
  | "HIKING"
  | "STRENGTH"
  | "YOGA"
  | "CROSSFIT"
  | "ROCK_CLIMBING"
  | "OTHER";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@openathlete.local";
const DEMO_FIRST_NAME = process.env.DEMO_USER_FIRST_NAME || "Demo";
const DEMO_LAST_NAME = process.env.DEMO_USER_LAST_NAME || "Athlete";

const YEAR = Number(process.env.DEMO_YEAR || 2025);
const MONTH = Number(process.env.DEMO_MONTH || 9); // 9 = September (JS Date uses 0-indexed months, but we will be careful below)

function toDate(y: number, m1to12: number, d: number, hours = 7, minutes = 0) {
  // m1to12 is 1..12; JS Date expects 0..11
  return new Date(Date.UTC(y, m1to12 - 1, d, hours, minutes, 0));
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomFloat(min, max + 1));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function kmToMeters(km: number) {
  return km * 1000;
}

function paceToSpeedMps(minutesPerKm: number) {
  const totalSeconds = minutesPerKm * 60;
  return 1000 / totalSeconds;
}

async function upsertDemoUserAndAthlete() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      first_name: DEMO_FIRST_NAME,
      last_name: DEMO_LAST_NAME,
      // ensure the demo user is also a coach
      roles: { set: ["ATHLETE", "COACH"] },
    },
    create: {
      email: DEMO_EMAIL,
      password: "demo-hash",
      roles: ["ATHLETE", "COACH"],
      first_name: DEMO_FIRST_NAME,
      last_name: DEMO_LAST_NAME,
    },
  });

  const athlete = await prisma.athlete.upsert({
    where: { user_id: user.user_id },
    update: {},
    create: { user_id: user.user_id },
  });

  return { user, athlete };
}

async function clearExistingMonth(
  athleteId: number,
  year: number,
  month1to12: number
) {
  const monthStart = toDate(year, month1to12, 1, 0, 0);
  const monthEnd = toDate(
    year,
    month1to12,
    new Date(Date.UTC(year, month1to12, 0)).getUTCDate(),
    23,
    59
  );

  const events = await prisma.event.findMany({
    where: {
      athlete_id: athleteId,
      start_date: { gte: monthStart, lte: monthEnd },
    },
    select: { event_id: true },
  });

  if (events.length === 0) return;

  const eventIds = events.map((e) => e.event_id);

  await prisma.event_activity.deleteMany({
    where: { event_id: { in: eventIds } },
  });
  await prisma.event_training.deleteMany({
    where: { event_id: { in: eventIds } },
  });
  await prisma.event_competition.deleteMany({
    where: { event_id: { in: eventIds } },
  });
  await prisma.event_note.deleteMany({ where: { event_id: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { event_id: { in: eventIds } } });
}

function buildTrainingName(sport: Sport) {
  const templates: Record<Sport, string[]> = {
    RUNNING: ["Easy Run", "Intervals", "Tempo Run", "Long Run", "Recovery Run"],
    TRAIL_RUNNING: [
      "Trail Endurance",
      "Hill Repeats",
      "Technical Trail",
      "Vertical Session",
    ],
    CYCLING: [
      "Endurance Ride",
      "Sweet Spot",
      "VO2 Max",
      "Recovery Spin",
      "Long Ride",
    ],
    SWIMMING: [
      "Endurance Swim",
      "Intervals Swim",
      "Technique Drills",
      "Open Water Style",
    ],
    HIKING: ["Hiking Session", "Steep Hiking", "Endurance Hike"],
    STRENGTH: ["Full Body Strength", "Lower Body Strength", "Core & Mobility"],
    YOGA: ["Yoga Flow", "Mobility & Stretch"],
    CROSSFIT: ["Cross-Training WOD"],
    ROCK_CLIMBING: ["Climbing Session"],
    OTHER: ["General Conditioning"],
  };
  return pickOne(templates[sport]);
}

function pickTrainingSport(dayOfWeek: number): Sport {
  // Emphasize running and cycling, sprinkle cross-training
  const weekday = dayOfWeek; // 0..6 Sun..Sat
  if (weekday === 1 || weekday === 3) return "RUNNING"; // Mon/Wed quality
  if (weekday === 2) return "CYCLING"; // Tue
  if (weekday === 5) return pickOne(["RUNNING", "TRAIL_RUNNING"]); // Fri
  if (weekday === 6) return "LONG"; // placeholder; handled below
  if (weekday === 0) return pickOne(["YOGA", "STRENGTH"]); // Sun light
  return pickOne(["RUNNING", "CYCLING", "STRENGTH"]);
}

function buildPlannedTrainingForDay(date: Date) {
  const dow = date.getUTCDay();
  let sport: Sport = pickTrainingSport(dow);
  if (sport === "LONG") sport = pickOne(["RUNNING", "CYCLING"]);
  const name = buildTrainingName(sport);

  // Goal targets by sport
  let goalDistanceMeters: number | null = null;
  let goalDurationSec: number | null = null;
  let goalElevationGain: number | null = null;

  switch (sport) {
    case "RUNNING": {
      const isLong = dow === 6; // Saturday
      const km = isLong ? randomInt(18, 28) : randomInt(6, 14);
      goalDistanceMeters = kmToMeters(km);
      goalDurationSec = Math.round(km * 5.2 * 60); // ~5:12/km average plan
      goalElevationGain = randomInt(50, isLong ? 400 : 150);
      break;
    }
    case "TRAIL_RUNNING": {
      const km = randomInt(10, 20);
      goalDistanceMeters = kmToMeters(km);
      goalDurationSec = Math.round(km * 6.5 * 60);
      goalElevationGain = randomInt(300, 900);
      break;
    }
    case "CYCLING": {
      const km = randomInt(30, 90);
      goalDistanceMeters = kmToMeters(km);
      goalDurationSec = Math.round((km / 28) * 3600); // ~28 km/h
      goalElevationGain = randomInt(200, 1200);
      break;
    }
    case "SWIMMING": {
      const m = randomInt(1200, 3000);
      goalDistanceMeters = m;
      goalDurationSec = Math.round(m / 2.1); // ~2.1 m/s ~ 1:35/100
      goalElevationGain = null;
      break;
    }
    case "STRENGTH": {
      goalDistanceMeters = null;
      goalDurationSec = 45 * 60;
      goalElevationGain = null;
      break;
    }
    case "YOGA": {
      goalDistanceMeters = null;
      goalDurationSec = 35 * 60;
      goalElevationGain = null;
      break;
    }
    default: {
      goalDistanceMeters = null;
      goalDurationSec = 60 * 60;
      goalElevationGain = null;
    }
  }

  return {
    sport,
    name,
    goalDistanceMeters,
    goalDurationSec,
    goalElevationGain,
  };
}

function buildActivityFromPlan(
  plan: ReturnType<typeof buildPlannedTrainingForDay>
) {
  const { sport } = plan;
  // Slight variations between plan and activity
  if (sport === "RUNNING" || sport === "TRAIL_RUNNING") {
    const distKm = plan.goalDistanceMeters
      ? plan.goalDistanceMeters / 1000
      : randomInt(6, 12);
    const avgPace = randomFloat(4.3, sport === "TRAIL_RUNNING" ? 7.5 : 5.8);
    const movingSec = Math.round(distKm * avgPace * 60);
    const avgSpeed = 1000 / (avgPace * 60);
    const maxSpeed = avgSpeed * randomFloat(1.2, 1.4);
    return {
      distance: kmToMeters(distKm),
      elevation_gain:
        sport === "TRAIL_RUNNING" ? randomInt(300, 1100) : randomInt(50, 250),
      moving_time: movingSec,
      average_speed: avgSpeed,
      max_speed: maxSpeed,
      average_cadence: randomInt(160, 182),
      average_heartrate: randomInt(130, 164),
      max_heartrate: randomInt(170, 190),
      sport,
    };
  }
  if (sport === "CYCLING") {
    const distKm = plan.goalDistanceMeters
      ? plan.goalDistanceMeters / 1000
      : randomInt(35, 85);
    const avgSpeed = randomFloat(7.5, 9.2); // m/s ~ 27-33 km/h
    const movingSec = Math.round((distKm * 1000) / avgSpeed);
    const maxSpeed = avgSpeed * randomFloat(1.3, 1.6);
    return {
      distance: kmToMeters(distKm),
      elevation_gain: randomInt(200, 1300),
      moving_time: movingSec,
      average_speed: avgSpeed,
      max_speed: maxSpeed,
      average_cadence: randomInt(70, 92),
      average_watts: randomInt(140, 280),
      max_watts: randomInt(550, 900),
      weighted_average_watts: randomInt(160, 260),
      sport,
    };
  }
  if (sport === "SWIMMING") {
    const meters = plan.goalDistanceMeters || randomInt(1500, 2800);
    const avgMps = randomFloat(1.2, 1.7);
    const movingSec = Math.round(meters / avgMps);
    return {
      distance: meters,
      elevation_gain: 0,
      moving_time: movingSec,
      average_speed: avgMps,
      max_speed: avgMps * randomFloat(1.1, 1.25),
      sport,
    };
  }
  // Strength/Yoga/etc. as activities: represent short generic metrics
  const meters = randomInt(0, 1000);
  const avgMps = randomFloat(0.5, 1.5);
  const movingSec = randomInt(1800, 4200);
  return {
    distance: meters,
    elevation_gain: randomInt(0, 50),
    moving_time: movingSec,
    average_speed: avgMps,
    max_speed: avgMps * randomFloat(1.1, 1.3),
    sport,
  };
}

async function createTrainingEvent(
  athleteId: number,
  date: Date,
  plan: ReturnType<typeof buildPlannedTrainingForDay>
) {
  const start = new Date(date);
  const end = new Date(date);
  end.setUTCHours(start.getUTCHours() + 2);

  const event = await prisma.event.create({
    data: {
      name: plan.name,
      type: "TRAINING",
      start_date: start,
      end_date: end,
      athlete_id: athleteId,
      training: {
        create: {
          sport: plan.sport,
          description: "",
          goal_distance: plan.goalDistanceMeters ?? undefined,
          goal_duration: plan.goalDurationSec ?? undefined,
          goal_elevation_gain: plan.goalElevationGain ?? undefined,
          goal_rpe: randomFloat(0.2, 0.8),
        },
      },
    },
    include: { training: true },
  });
  return event;
}

async function createCompetitionEvent(
  athleteId: number,
  date: Date,
  sport: Sport,
  name: string
) {
  const start = new Date(date);
  const end = new Date(date);
  end.setUTCHours(start.getUTCHours() + 6);

  const event = await prisma.event.create({
    data: {
      name,
      type: "COMPETITION",
      start_date: start,
      end_date: end,
      athlete_id: athleteId,
      competition: {
        create: {
          sport,
          description: "A-race objective",
          goal_distance:
            sport === "RUNNING"
              ? kmToMeters(21.1)
              : sport === "CYCLING"
                ? kmToMeters(120)
                : null,
          goal_duration: null,
          goal_elevation_gain:
            sport === "TRAIL_RUNNING"
              ? randomInt(1200, 2500)
              : randomInt(100, 600),
          goal_rpe: 0.9,
        },
      },
    },
    include: { competition: true },
  });
  return event;
}

async function createActivityEvent(
  athleteId: number,
  date: Date,
  plan: ReturnType<typeof buildPlannedTrainingForDay>,
  maybeLinkToTrainingEventId?: number
) {
  const start = new Date(date);
  const end = new Date(date);
  const metrics = buildActivityFromPlan(plan);

  const name = `${plan.name} • ${plan.sport}`;
  const activity = await prisma.event.create({
    data: {
      name,
      type: "ACTIVITY",
      start_date: start,
      end_date: end,
      athlete_id: athleteId,
      activity: {
        create: {
          provider: "STRAVA",
          external_id: `demo-${start.toISOString()}`,
          description: "",
          distance: metrics.distance,
          elevation_gain: metrics.elevation_gain,
          moving_time: metrics.moving_time,
          average_speed: metrics.average_speed,
          max_speed: metrics.max_speed,
          average_cadence: metrics.average_cadence ?? null,
          average_heartrate: metrics.average_heartrate ?? null,
          max_heartrate: metrics.max_heartrate ?? null,
          average_watts: metrics.average_watts ?? null,
          max_watts: metrics.max_watts ?? null,
          weighted_average_watts: metrics.weighted_average_watts ?? null,
          sport: metrics.sport,
        },
      },
    },
    include: { activity: true },
  });

  if (maybeLinkToTrainingEventId) {
    await prisma.event_training.update({
      where: { event_id: maybeLinkToTrainingEventId },
      data: { related_activity_id: activity.activity!.event_activity_id },
    });
  }

  return activity;
}

async function seedMonthForAthlete(
  athleteId: number,
  year: number,
  month1to12: number
) {
  await clearExistingMonth(athleteId, year, month1to12);

  const daysInMonth = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();

  const raceDay = 15;
  const raceSport: Sport = pickOne(["RUNNING", "TRAIL_RUNNING", "CYCLING"]);
  const race = await createCompetitionEvent(
    athleteId,
    toDate(year, month1to12, raceDay, 8, 30),
    raceSport,
    raceSport === "RUNNING"
      ? "Half Marathon"
      : raceSport === "TRAIL_RUNNING"
        ? "Trail 30K"
        : "Gran Fondo"
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const date = toDate(year, month1to12, day, 7, 0);
    const dow = date.getUTCDay();

    const isRest = dow === 4 && Math.random() < 0.6;
    if (isRest) {
      await prisma.event.create({
        data: {
          name: "Rest / Recovery",
          type: "NOTE",
          start_date: date,
          end_date: new Date(date.getTime() + 60 * 60 * 1000),
          athlete_id: athleteId,
          note: {
            create: {
              description: "Recovery focus: hydration, mobility, sleep",
            },
          },
        },
      });
      continue;
    }

    if (day === raceDay) {
      const plan = {
        sport: race.competition!.sport as Sport,
        name: race.name,
        goalDistanceMeters: null,
        goalDurationSec: null,
        goalElevationGain: null,
      } as const;
      await createActivityEvent(
        athleteId,
        toDate(year, month1to12, day, 8, 45),
        plan,
        undefined
      );
      continue;
    }

    const planned = buildPlannedTrainingForDay(date);
    const training = await createTrainingEvent(athleteId, date, planned);

    if (Math.random() < 0.7) {
      const linkIt = Math.random() < 0.6;
      await createActivityEvent(
        athleteId,
        toDate(year, month1to12, day, 18, 0),
        planned,
        linkIt ? training.event_id : undefined
      );
    }
  }
}

async function upsertCoachedAthlete(
  coachUserId: number,
  email: string,
  firstName: string,
  lastName: string
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      first_name: firstName,
      last_name: lastName,
      roles: { set: ["ATHLETE"] },
    },
    create: {
      email,
      password: "demo-hash",
      roles: ["ATHLETE"],
      first_name: firstName,
      last_name: lastName,
    },
  });

  const athlete = await prisma.athlete.upsert({
    where: { user_id: user.user_id },
    update: {},
    create: { user_id: user.user_id },
  });

  const existingLink = await prisma.coach_athlete.findFirst({
    where: { user_id: coachUserId, athlete_id: athlete.athlete_id },
  });
  if (!existingLink) {
    await prisma.coach_athlete.create({
      data: { user_id: coachUserId, athlete_id: athlete.athlete_id },
    });
  }

  return athlete;
}

async function seedAll() {
  const { user, athlete } = await upsertDemoUserAndAthlete();

  // Seed the demo user's month (September 2025)
  await seedMonthForAthlete(athlete.athlete_id, YEAR, MONTH);

  // Create a couple of coached athletes and seed September & October 2025 for them
  const coachedSpecs = [
    { email: `coached1+${DEMO_EMAIL}`, first: "Alice", last: "Dupont" },
    { email: `coached2+${DEMO_EMAIL}`, first: "Marc", last: "Leroy" },
  ];

  for (const spec of coachedSpecs) {
    const a = await upsertCoachedAthlete(
      user.user_id,
      spec.email,
      spec.first,
      spec.last
    );
    await seedMonthForAthlete(a.athlete_id, 2025, 9);
    await seedMonthForAthlete(a.athlete_id, 2025, 10);
  }
}

seedAll()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Demo month seeded successfully");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
