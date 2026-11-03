/**
 * Camille's season, worked out backwards from her goal race so it always
 * sits about a month after "today": a spring road marathon, a trail block,
 * a calf strain, a summer ultra, a fast 10 km in the autumn, then the build
 * towards the SaintéLyon. One entry per session, past and future.
 */
import type { CompetitionPriority, CycleKind, CyclePhase, SportType } from '../../../libs/database/generated/client';

import { addDays, daysBetween, mondayOf, weekday } from './dates';
import { Random } from './random';
import type { Block, RouteId } from './streams';
import { pace, Session, sessions } from './workouts';

export interface Race {
  day: Date;
  hour: number;
  name: string;
  sport: SportType;
  priority: CompetitionPriority;
  distance: number;
  elevation: number;
  description: string;
  /** Finish-line execution, for past races */
  result?: { routes: RouteId[]; blocks: Block[]; activityName: string; rpe: number; notes: string };
}

export interface Period {
  name: string;
  start: Date;
  end: Date;
  kind: CycleKind;
  phase: CyclePhase | null;
  color: string;
  description: string;
}

export interface PlannedDay {
  day: Date;
  hour: number;
  minute: number;
  session: Session;
  /** A planned session in the calendar (recent past and future) */
  planned: boolean;
  /** Recorded by the watch (past only) */
  executed: boolean;
  strain: number;
  rpe: number;
}

export interface Season {
  goalRace: Date;
  races: Race[];
  periods: Period[];
  days: PlannedDay[];
}

type WeekKind = 'base' | 'road' | 'taper' | 'recovery' | 'trail' | 'injury' | 'off' | 'specific';

export function buildSeason(today: Date): Season {
  const rng = new Random(20261205);
  // The Saturday a month or so ahead
  let goalRace = addDays(today, 30);
  while (weekday(goalRace) !== 5) goalRace = addDays(goalRace, 1);
  const before = (days: number) => addDays(goalRace, -days);

  const marathon = before(230);
  const maxiRace = before(189);
  const ultra = before(100);
  const tenK = before(62);
  const saleve = before(20);

  const races: Race[] = [
    {
      day: marathon,
      hour: 8,
      name: "Marathon du Lac d'Annecy",
      sport: 'RUNNING',
      priority: 'A',
      distance: 42195,
      elevation: 120,
      description: 'Spring goal: sub 3:05. Start at 4:22/km, gel every 35 minutes.',
      result: {
        routes: ['lake-saint-jorioz'],
        blocks: [
          { distance: 30000, speed: pace('4:21'), name: '0-30 km' },
          { distance: 12195, speed: pace('4:24'), name: '30 km-finish' },
        ],
        activityName: "Marathon du Lac d'Annecy",
        rpe: 0.9,
        notes: 'Sub 3:05! Even pace until 30 km, then hung on. 3:04:40, a PB by 6 minutes.',
      },
    },
    {
      day: maxiRace,
      hour: 7,
      name: 'MaXi-Race Annecy · Marathon Race',
      sport: 'TRAIL_RUNNING',
      priority: 'B',
      distance: 42000,
      elevation: 2400,
      description: 'Trail block test. Run by feel, power-hike the steep parts.',
      result: {
        routes: ['mont-veyrier'],
        blocks: [{ distance: 41800, speed: 3.3, name: 'Race' }],
        activityName: 'MaXi-Race Annecy · Marathon Race',
        rpe: 0.85,
        notes: 'Legs good until the last descent. 14th woman.',
      },
    },
    {
      day: ultra,
      hour: 8,
      name: 'Ultra-Trail du Semnoz 57 km',
      sport: 'TRAIL_RUNNING',
      priority: 'A',
      distance: 57000,
      elevation: 3500,
      description: 'Summer goal: three laps of the Semnoz ridge. Finish strong, eat every 30 minutes.',
      result: {
        routes: ['semnoz'],
        blocks: [{ distance: 56600, speed: 3.05, name: 'Race' }],
        activityName: 'Ultra-Trail du Semnoz 57 km',
        rpe: 0.95,
        notes: 'What a day. Hot on the third climb to the Crêt de Châtillon, managed it. 7h43, 6th woman.',
      },
    },
    {
      day: tenK,
      hour: 9,
      name: "Foulées d'Annecy 10 km",
      sport: 'RUNNING',
      priority: 'C',
      distance: 10000,
      elevation: 25,
      description: 'Rust buster after the summer. Aim for 38 minutes.',
      result: {
        routes: ['paquier-loop'],
        blocks: [{ distance: 10000, speed: pace('3:47'), name: '10 km' }],
        activityName: "Foulées d'Annecy 10 km",
        rpe: 0.9,
        notes: '37:49, PB by 47 seconds. The speed work is paying off.',
      },
    },
    {
      day: saleve,
      hour: 9,
      name: 'Trail du Salève 23 km',
      sport: 'TRAIL_RUNNING',
      priority: 'B',
      distance: 23000,
      elevation: 1300,
      description: 'Dress rehearsal three weeks out: night-race kit, headlamp, race food.',
    },
    {
      day: goalRace,
      hour: 23,
      name: 'SaintéLyon',
      sport: 'TRAIL_RUNNING',
      priority: 'A',
      distance: 78000,
      elevation: 2000,
      description:
        'Saint-Étienne to Lyon through the night. Goal: under 9 hours. Start easy, the race begins after Sainte-Catherine.',
    },
  ];

  const periods: Period[] = [
    { name: 'Winter base', start: before(395), end: before(301), kind: 'TRAINING', phase: 'BASE', color: '#64748b', description: 'Aerobic volume, strength, some bike.' },
    { name: 'Flu', start: before(320), end: before(316), kind: 'ILLNESS', phase: null, color: '#a855f7', description: 'Fever, full rest.' },
    { name: 'Marathon build', start: before(300), end: before(245), kind: 'TRAINING', phase: 'SPECIFIC', color: '#2563eb', description: 'Marathon-pace blocks and long runs up to 32 km.' },
    { name: 'Marathon taper', start: before(244), end: before(230), kind: 'TRAINING', phase: 'TAPER', color: '#0ea5e9', description: '' },
    { name: 'Trail block', start: before(216), end: before(190), kind: 'TRAINING', phase: 'SPECIFIC', color: '#16a34a', description: 'Hills, vertical, back-to-back weekends.' },
    { name: 'Calf strain', start: before(173), end: before(160), kind: 'INJURY', phase: null, color: '#ef4444', description: 'Left soleus strain. Physio twice a week, bike only.' },
    { name: 'Summer ultra build', start: before(159), end: before(101), kind: 'TRAINING', phase: 'SPECIFIC', color: '#16a34a', description: 'Long mountain days, downhill legs.' },
    { name: 'Holidays in Corsica', start: before(89), end: before(83), kind: 'TRAVEL', phase: null, color: '#f59e0b', description: 'Family holiday, no plan.' },
    { name: 'Speed block', start: before(82), end: before(62), kind: 'TRAINING', phase: 'BASE', color: '#64748b', description: 'Back to speed before the winter goal.' },
    { name: 'SaintéLyon build', start: before(61), end: before(14), kind: 'TRAINING', phase: 'SPECIFIC', color: '#2563eb', description: 'Night runs, long trail days, threshold.' },
    { name: 'Taper', start: before(13), end: before(0), kind: 'TRAINING', phase: 'TAPER', color: '#0ea5e9', description: 'Volume down 40 %, keep some intensity.' },
  ];

  const weekKind = (monday: Date): WeekKind => {
    const dbr = daysBetween(monday, goalRace);
    if (dbr > 320 || (dbr <= 316 && dbr > 300)) return 'base';
    if (dbr > 316) return 'off';
    if (dbr > 244) return Math.floor((300 - dbr) / 7) % 4 === 3 ? 'recovery' : 'road';
    if (dbr > 230) return 'taper';
    if (dbr > 216) return 'recovery';
    if (dbr > 189) return 'trail';
    if (dbr > 175) return 'recovery';
    if (dbr > 159) return 'injury';
    if (dbr > 101) return Math.floor((159 - dbr) / 7) % 4 === 3 ? 'recovery' : 'trail';
    if (dbr > 89) return 'recovery';
    if (dbr > 82) return 'off';
    if (dbr > 61) return 'road';
    // Recovery the week of the 10 km race and two weeks before today's
    if (dbr > 13) return Math.floor((61 - dbr) / 7) % 4 === 2 ? 'recovery' : 'specific';
    return 'taper';
  };

  const days: PlannedDay[] = [];
  const start = mondayOf(addDays(today, -364));
  const planFrom = addDays(mondayOf(today), -42);
  const raceDays = new Set(races.map((r) => r.day.getTime()));
  let week = 0;

  for (let monday = start; monday <= mondayOf(goalRace); monday = addDays(monday, 7), week++) {
    const kind = weekKind(monday);
    const dbr = daysBetween(monday, goalRace);
    const longKm = Math.min(32, 16 + Math.max(0, (300 - dbr) / 7) * 1.2);
    const plan: (Session | null)[] = new Array(7).fill(null);
    const quality = [sessions.intervals1000(6), sessions.threshold(5), sessions.intervals400(12)][week % 3];

    switch (kind) {
      case 'base':
        plan[0] = week % 2 ? sessions.strength() : null;
        plan[1] = week % 2 ? sessions.threshold(4) : sessions.intervals400(10);
        plan[2] = sessions.easy(9, 'lake-sevrier');
        plan[3] = sessions.easy(8, 'albigny-loop');
        plan[5] = week % 3 === 0 ? sessions.sweetSpot() : sessions.bikeEndurance(90);
        plan[6] = sessions.longRun(Math.round(15 + (week % 4))) ;
        break;
      case 'road':
        plan[0] = sessions.strength();
        plan[1] = quality;
        plan[2] = sessions.easy(10, 'lake-sevrier');
        plan[3] = week % 2 ? sessions.marathonPace() : sessions.tempo();
        plan[5] = week % 2 ? sessions.easy(8, 'albigny-loop') : sessions.bikeEndurance(105);
        plan[6] = sessions.longRun(Math.round(longKm), week % 2 ? 0 : 8);
        break;
      case 'trail':
        plan[0] = sessions.strength();
        plan[1] = week % 2 ? sessions.threshold(5) : sessions.intervals1000(5);
        plan[2] = sessions.easy(10, 'albigny-loop');
        plan[3] = sessions.hills(10);
        plan[5] = week % 2 ? sessions.trailLong('mont-veyrier', 20, 1150, 'Mont Veyrier loop') : sessions.bikeEndurance(120, 'col-de-la-forclaz');
        plan[6] =
          week % 3 === 0
            ? sessions.trailLong('tournette', 21, 2000, 'La Tournette')
            : sessions.trailLong('semnoz', 26, 1900, 'Semnoz long trail');
        break;
      case 'specific':
        plan[0] = sessions.strength();
        plan[1] = week % 2 ? sessions.intervals1000(6) : sessions.threshold(5);
        plan[2] = sessions.easy(10, 'lake-sevrier');
        plan[3] = week % 2 ? sessions.hills(10) : sessions.tempo();
        plan[4] = sessions.easy(7, 'albigny-loop');
        plan[5] = sessions.trailLong('cret-du-maure', 14, 800, 'Night trail, Crêt du Maure');
        plan[6] = week % 2 ? sessions.trailLong('semnoz', 30, 2100, 'Semnoz long trail') : sessions.longRun(26, 6);
        break;
      case 'recovery':
        plan[1] = sessions.easy(8, 'albigny-loop');
        plan[2] = sessions.bikeEndurance(60);
        plan[3] = sessions.easy(8, 'lake-sevrier');
        plan[5] = sessions.recovery(45);
        plan[6] = sessions.easy(14, 'lake-sevrier');
        break;
      case 'taper':
        plan[1] = sessions.intervals1000(4);
        plan[2] = sessions.easy(8, 'albigny-loop');
        plan[3] = sessions.marathonPace();
        plan[5] = sessions.easy(6, 'paquier-loop');
        plan[6] = sessions.easy(12, 'lake-sevrier');
        break;
      case 'injury':
        plan[1] = sessions.bikeEndurance(60);
        plan[3] = sessions.strength();
        plan[5] = sessions.bikeEndurance(90);
        plan[6] = dbr < 166 ? sessions.recovery(30) : sessions.bikeEndurance(120, 'col-de-la-forclaz');
        break;
      case 'off':
        break;
    }

    plan.forEach((session, dow) => {
      if (!session) return;
      const day = addDays(monday, dow);
      if (raceDays.has(day.getTime())) return;
      // The day before and after a race stay light
      if (raceDays.has(addDays(day, 1).getTime()) || raceDays.has(addDays(day, -1).getTime())) return;
      if (daysBetween(day, goalRace) <= 1 && daysBetween(day, goalRace) >= 0) return;
      const past = day < today;
      const isToday = day.getTime() === today.getTime();
      const weekend = dow >= 5;
      const night = session.name.startsWith('Night');
      days.push({
        day,
        hour: night ? 19 : weekend ? 8 : dow === 2 ? 7 : 18,
        minute: night ? 0 : weekend ? 30 : dow === 2 ? 0 : 30,
        session,
        planned: day >= planFrom,
        executed: past && !isToday && !(rng.chance(0.06) && day >= planFrom),
        strain: rng.range(0.985, 1.03),
        rpe: Math.min(1, Math.max(0.1, session.goalRpe + rng.normal(0, 0.06))),
      });
    });
  }

  return { goalRace, races, periods, days };
}
