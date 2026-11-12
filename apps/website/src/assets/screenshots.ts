/**
 * Product screenshots, captured from the seeded demo accounts by
 * scripts/screenshots (desktop 1440×900 and phone 390×844, at 2x).
 * Pages pick them by key, so recapturing never touches page code.
 */
import activity from './screenshots/desktop-activity-intervals-laps.webp';
import activityMap from './screenshots/desktop-activity-race.webp';
import aiGenerate from './screenshots/desktop-activity-trail.webp';
import calendarMonth from './screenshots/desktop-calendar-month.webp';
import season from './screenshots/desktop-calendar-season.webp';
import calendarWeek from './screenshots/desktop-calendar-week.webp';
import coachAthleteCalendar from './screenshots/desktop-coach-athlete-calendar.webp';
import coachRoster from './screenshots/desktop-coach-athletes.webp';
import coachDashboard from './screenshots/desktop-coach-dashboard.webp';
import chat from './screenshots/desktop-messages.webp';
import metrics from './screenshots/desktop-metrics.webp';
import player from './screenshots/desktop-player-exercise.webp';
import records from './screenshots/desktop-records.webp';
import sessionDetail from './screenshots/desktop-session-detail.webp';
import aiSettings from './screenshots/desktop-settings-ai-keys.webp';
import integrations from './screenshots/desktop-settings-connectors.webp';
import subscription from './screenshots/desktop-settings-subscription.webp';
import zones from './screenshots/desktop-settings-zones.webp';
import capacities from './screenshots/desktop-statistics-capacities-trail.webp';
import trainingLoad from './screenshots/desktop-statistics-load.webp';
import strengthEditor from './screenshots/desktop-strength-editor.webp';
import workoutLibrary from './screenshots/desktop-template-library.webp';
import workoutEditor from './screenshots/desktop-workout-editor.webp';
import mobileActivity from './screenshots/mobile-activity.webp';
import mobileCalendar from './screenshots/mobile-calendar.webp';
import mobileChat from './screenshots/mobile-messages.webp';
import mobilePlayer from './screenshots/mobile-player-exercise.webp';
import mobilePlayerRest from './screenshots/mobile-player-rest.webp';
import mobileStrength from './screenshots/mobile-strength-editor.webp';
import mobileHome from './screenshots/mobile-today.webp';
import mobileWorkout from './screenshots/mobile-workout-detail.webp';

export const shots = {
  calendarMonth,
  calendarWeek,
  season,
  workoutEditor,
  workoutLibrary,
  sessionDetail,
  strengthEditor,
  player,
  activity,
  activityMap,
  records,
  capacities,
  trainingLoad,
  metrics,
  zones,
  aiSettings,
  aiGenerate,
  integrations,
  subscription,
  coachDashboard,
  coachRoster,
  coachAthleteCalendar,
  chat,
  mobileHome,
  mobileCalendar,
  mobileActivity,
  mobileWorkout,
  mobileChat,
  mobilePlayer,
  mobilePlayerRest,
  mobileStrength,
};

export type ShotKey = keyof typeof shots;
