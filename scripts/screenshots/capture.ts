/**
 * Captures the product screenshots from the seeded screenshot stack.
 *
 *   pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/capture.ts [outDir] [--only=name,name]
 *
 * Needs start.sh running and seed.ts applied (processing finished).
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

import type { Browser, BrowserContext, Page } from '@playwright/test';

import { CAMILLE_EMAIL, COACH_EMAIL, PASSWORD } from './lib/accounts';

const WEB = process.env.SCREENSHOTS_WEB_URL ?? 'http://localhost:5180';
const API = process.env.SCREENSHOTS_API_URL ?? 'http://localhost:3010';
const args = process.argv.slice(2);
const OUT = resolve(args.find((a) => !a.startsWith('--')) ?? join(__dirname, 'out'));
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');

const { chromium } = createRequire(join(__dirname, '..', '..', 'e2e', 'package.json'))(
  '@playwright/test',
) as typeof import('@playwright/test');

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

type Who = 'athlete' | 'coach';
type Device = 'desktop' | 'mobile';

interface Shot {
  name: string;
  who: Who;
  device?: Device;
  theme?: 'light' | 'dark';
  path: string | ((ids: Ids) => string);
  /** Clicks and waits after the page loaded */
  prepare?: (page: Page, ids: Ids) => Promise<void>;
  fullPage?: boolean;
}

interface Ids {
  camilleAthleteId: number;
  activity: Record<string, number>;
  training: Record<string, number>;
}

async function login(email: string): Promise<Tokens> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  return (await res.json()) as Tokens;
}

async function api<T>(tokens: Tokens, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${tokens.accessToken}` } });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

interface EventRow {
  eventId: number;
  type: string;
  name: string;
  startDate: string;
}

async function findIds(athlete: Tokens): Promise<Ids> {
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const events = await api<EventRow[]>(athlete, `/event?startDate=${day(-120)}&endDate=${day(35)}`);
  const me = await api<{ athleteId: number }>(athlete, '/athlete/me');
  const now = Date.now();
  const past = events.filter((e) => new Date(e.startDate).getTime() < now);
  const latest = (pred: (e: EventRow) => boolean) => past.filter(pred).at(-1)?.eventId ?? 0;
  /** The activity recorded for the latest planned session of that name */
  const doneAs = (name: string) => {
    const training = past.filter((e) => e.type === 'TRAINING' && e.name.startsWith(name)).at(-1);
    return past.find((e) => e.type === 'ACTIVITY' && e.startDate === training?.startDate)?.eventId ?? 0;
  };
  return {
    camilleAthleteId: me.athleteId,
    activity: {
      longTrail: latest((e) => e.type === 'ACTIVITY' && e.name === 'Quintal Trail Running'),
      race: latest((e) => e.type === 'ACTIVITY' && e.name.startsWith('Ultra-Trail')),
      tenK: latest((e) => e.type === 'ACTIVITY' && e.name.includes('10 km')),
      intervals: doneAs('6 × 1000'),
      longRun: doneAs('Long run'),
    },
    training: {},
  };
}

const VIEWPORTS: Record<Device, { width: number; height: number; isMobile: boolean; hasTouch: boolean }> = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

async function newContext(browser: Browser, tokens: Tokens, shot: Shot): Promise<BrowserContext> {
  const device = VIEWPORTS[shot.device ?? 'desktop'];
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: 2,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    locale: 'en-GB',
    timezoneId: 'Europe/Paris',
    colorScheme: shot.theme ?? 'light',
  });
  await context.addCookies([{ name: 'OA_LOCALE', value: 'en', url: WEB }]);
  await context.addInitScript(
    ({ tokens, space, theme }) => {
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      localStorage.setItem('current_space', space);
      localStorage.setItem('theme', theme);
      localStorage.setItem('openathlete-tracking-consent-v2', 'denied');
      localStorage.setItem('openathlete_push_prompt_dismissed', 'true');
    },
    { tokens, space: shot.who === 'coach' ? 'COACH' : 'ATHLETE', theme: shot.theme ?? 'light' },
  );
  return context;
}

/** Waits for requests, skeletons and map tiles to settle. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page
    .waitForFunction(() => !document.querySelector('.animate-pulse, [data-slot="skeleton"], .animate-spin'), undefined, {
      timeout: 15_000,
    })
    .catch(() => undefined);
  if (await page.locator('.leaflet-container').count()) {
    await page
      .waitForFunction(
        () => {
          const tiles = Array.from(document.querySelectorAll<HTMLImageElement>('.leaflet-tile'));
          return tiles.length > 0 && tiles.every((t) => t.complete);
        },
        undefined,
        { timeout: 20_000 },
      )
      .catch(() => console.warn('  map tiles did not all load')); // eslint-disable-line no-console
  }
  // Chart animations
  await page.waitForTimeout(1500);
}

const HIDE = `
  [data-sonner-toaster], .Toastify, [data-tanstack-query-devtools] { display: none !important; }
  * { caret-color: transparent !important; }
`;

async function take(browser: Browser, tokens: Record<Who, Tokens>, ids: Ids, shot: Shot) {
  const context = await newContext(browser, tokens[shot.who], shot);
  const page = await context.newPage();
  const path = typeof shot.path === 'function' ? shot.path(ids) : shot.path;
  await page.goto(`${WEB}${path}`);
  await page.addStyleTag({ content: HIDE });
  await settle(page);
  if (shot.prepare) {
    await shot.prepare(page, ids);
    await settle(page);
  }
  await page.addStyleTag({ content: HIDE });
  await page.screenshot({ path: join(OUT, `${shot.name}.png`), fullPage: shot.fullPage ?? false });
  await context.close();
  console.log(`  ${shot.name}`); // eslint-disable-line no-console
}

/** Scrolls the page so the first element with that text sits near the top. */
const scrollTo = (text: string | RegExp, offset = 24, which: 'first' | 'last' = 'first') => async (page: Page) => {
  const matches = page.getByText(text);
  await (which === 'last' ? matches.last() : matches.first())
    .evaluate((el, off) => {
      el.scrollIntoView({ block: 'start' });
      const scroller = el.closest('main') ?? document.scrollingElement;
      scroller?.scrollBy(0, -off);
      window.scrollBy(0, -off);
    }, offset);
};

const calendarView = (view: 'Month' | 'Week' | 'Season') => async (page: Page) => {
  await page.getByRole('tab', { name: view }).click();
};

/** Opens a session from the calendar week. */
const openSession = (name: string) => async (page: Page) => {
  await calendarView('Week')(page);
  await page.waitForTimeout(1500);
  await page.locator('main').getByText(name).last().click();
  await page.waitForTimeout(1500);
};

const steps =
  (...fns: ((page: Page, ids: Ids) => Promise<void>)[]) =>
  async (page: Page, ids: Ids) => {
    for (const fn of fns) {
      await fn(page, ids);
      await page.waitForTimeout(800);
    }
  };

const statisticsTab = (name: string) => async (page: Page) => {
  await page.getByRole('tab', { name }).click();
};

const statisticsPeriod = (label: string) => async (page: Page) => {
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: label }).click();
};

export const SHOTS: Shot[] = [
  // Athlete, desktop
  { name: 'desktop-calendar-month', who: 'athlete', path: '/dashboard/calendar', prepare: calendarView('Month') },
  {
    name: 'desktop-calendar-month-grid',
    who: 'athlete',
    path: '/dashboard/calendar',
    prepare: steps(calendarView('Month'), scrollTo(/^Calendar of /)),
  },
  { name: 'desktop-calendar-week', who: 'athlete', path: '/dashboard/calendar', prepare: steps(calendarView('Week'), scrollTo(/^Calendar of /)) },
  { name: 'desktop-calendar-season', who: 'athlete', path: '/dashboard/calendar', prepare: steps(calendarView('Season'), scrollTo(/^Calendar of /)) },
  { name: 'desktop-session-detail', who: 'athlete', path: '/dashboard/calendar', prepare: openSession('6 × 1000 m') },
  {
    name: 'desktop-workout-editor',
    who: 'athlete',
    path: '/dashboard/calendar',
    prepare: steps(
      openSession('6 × 1000 m'),
      async (p) => p.getByRole('dialog').getByRole('button', { name: 'Edit' }).click(),
      scrollTo(/Goal Elevation Gain/),
    ),
  },
  {
    name: 'desktop-template-library',
    who: 'athlete',
    path: '/dashboard/calendar',
    prepare: steps(calendarView('Week'), async (p) => p.getByRole('button', { name: /Template Library/i }).click()),
  },
  { name: 'desktop-activity-trail', who: 'athlete', path: (ids) => `/dashboard/activity/${ids.activity.longTrail}` },
  {
    name: 'desktop-activity-trail-summary',
    who: 'athlete',
    path: (ids) => `/dashboard/activity/${ids.activity.longTrail}`,
    prepare: scrollTo(/^Planned as/),
  },
  {
    name: 'desktop-activity-trail-charts',
    who: 'athlete',
    path: (ids) => `/dashboard/activity/${ids.activity.longTrail}`,
    prepare: scrollTo(/^Charts$/, 24, 'last'),
  },
  {
    name: 'desktop-activity-trail-conditions',
    who: 'athlete',
    path: (ids) => `/dashboard/activity/${ids.activity.longTrail}`,
    prepare: async (p) => p.getByRole('tab', { name: 'Conditions' }).click(),
  },
  { name: 'desktop-activity-intervals', who: 'athlete', path: (ids) => `/dashboard/activity/${ids.activity.intervals}` },
  {
    name: 'desktop-activity-intervals-laps',
    who: 'athlete',
    path: (ids) => `/dashboard/activity/${ids.activity.intervals}`,
    prepare: scrollTo(/^Laps and intervals$/, 24, 'last'),
  },
  { name: 'desktop-activity-race', who: 'athlete', path: (ids) => `/dashboard/activity/${ids.activity.race}` },
  { name: 'desktop-statistics-overview', who: 'athlete', path: '/dashboard/statistics' },
  { name: 'desktop-statistics-load', who: 'athlete', path: '/dashboard/statistics', prepare: statisticsTab('Load') },
  {
    name: 'desktop-statistics-load-year',
    who: 'athlete',
    path: '/dashboard/statistics',
    prepare: steps(statisticsPeriod('12 months'), statisticsTab('Load')),
  },
  { name: 'desktop-statistics-capacities', who: 'athlete', path: '/dashboard/statistics', prepare: statisticsTab('Capacities') },
  {
    name: 'desktop-statistics-capacities-trail',
    who: 'athlete',
    path: '/dashboard/statistics',
    prepare: steps(statisticsTab('Capacities'), async (p) => p.getByRole('tab', { name: 'Trail Running' }).click()),
  },
  { name: 'desktop-statistics-trends', who: 'athlete', path: '/dashboard/statistics', prepare: statisticsTab('Trends') },
  { name: 'desktop-statistics-year', who: 'athlete', path: '/dashboard/statistics', prepare: statisticsTab('Year in review') },
  { name: 'desktop-records', who: 'athlete', path: '/dashboard/records' },
  { name: 'desktop-metrics', who: 'athlete', path: '/dashboard/metrics' },
  { name: 'desktop-settings-zones', who: 'athlete', path: '/dashboard/settings?tab=training_zones' },
  {
    name: 'desktop-settings-zones-pace',
    who: 'athlete',
    path: '/dashboard/settings?tab=training_zones',
    prepare: async (p) => p.getByRole('tab', { name: 'Pace' }).click(),
  },
  { name: 'desktop-settings-connectors', who: 'athlete', path: '/dashboard/settings?tab=connectors' },
  { name: 'desktop-settings-ai', who: 'athlete', path: '/dashboard/settings?tab=ai' },
  { name: 'desktop-settings-ai-keys', who: 'athlete', path: '/dashboard/settings?tab=ai', prepare: scrollTo(/^API keys$/) },
  { name: 'desktop-settings-subscription', who: 'athlete', path: '/dashboard/settings?tab=subscription' },
  {
    name: 'desktop-messages',
    who: 'athlete',
    path: '/dashboard/messages',
    prepare: async (p) => p.getByText(/^Julien Moreau, Camille/).first().click(),
  },
  // Coach, desktop
  { name: 'desktop-coach-dashboard', who: 'coach', path: '/dashboard/coach' },
  { name: 'desktop-coach-athletes', who: 'coach', path: '/dashboard/settings?tab=athletes' },
  {
    name: 'desktop-coach-athlete-calendar',
    who: 'coach',
    path: (ids) => `/dashboard/calendar/${ids.camilleAthleteId}`,
    prepare: steps(calendarView('Month'), scrollTo(/^Calendar of /)),
  },
  {
    name: 'desktop-coach-athlete-week',
    who: 'coach',
    path: (ids) => `/dashboard/calendar/${ids.camilleAthleteId}`,
    prepare: calendarView('Week'),
  },
  { name: 'desktop-coach-athlete-statistics', who: 'coach', path: (ids) => `/dashboard/statistics/${ids.camilleAthleteId}` },
  {
    name: 'desktop-coach-template-library',
    who: 'coach',
    path: (ids) => `/dashboard/calendar/${ids.camilleAthleteId}`,
    prepare: steps(calendarView('Week'), async (p) => p.getByRole('button', { name: /Template Library/i }).click()),
  },
  // Dark theme
  { name: 'desktop-dark-calendar-week', who: 'athlete', theme: 'dark', path: '/dashboard/calendar', prepare: steps(calendarView('Week'), scrollTo(/^Calendar of /)) },
  { name: 'desktop-dark-activity-trail', who: 'athlete', theme: 'dark', path: (ids) => `/dashboard/activity/${ids.activity.longTrail}` },
  { name: 'desktop-dark-statistics-load', who: 'athlete', theme: 'dark', path: '/dashboard/statistics', prepare: statisticsTab('Load') },
  { name: 'desktop-dark-coach-dashboard', who: 'coach', theme: 'dark', path: '/dashboard/coach' },
  // Mobile
  { name: 'mobile-today', who: 'athlete', device: 'mobile', path: '/dashboard/today' },
  { name: 'mobile-calendar', who: 'athlete', device: 'mobile', path: '/dashboard/calendar', prepare: calendarView('Week') },
  { name: 'mobile-calendar-month', who: 'athlete', device: 'mobile', path: '/dashboard/calendar', prepare: calendarView('Month') },
  { name: 'mobile-activity', who: 'athlete', device: 'mobile', path: (ids) => `/dashboard/activity/${ids.activity.longTrail}` },
  {
    name: 'mobile-activity-map',
    who: 'athlete',
    device: 'mobile',
    path: (ids) => `/dashboard/activity/${ids.activity.longTrail}`,
    prepare: scrollTo(/^Statistics$/, 16, 'last'),
  },
  {
    name: 'mobile-workout-detail',
    who: 'athlete',
    device: 'mobile',
    path: '/dashboard/today',
    prepare: steps(async (p) => p.getByText('6 × 1000 m').first().click(), scrollTo(/^Description$/)),
  },
  {
    name: 'mobile-messages',
    who: 'athlete',
    device: 'mobile',
    path: '/dashboard/messages',
    prepare: async (p) => p.getByText(/^Julien Moreau, Camille/).first().click(),
  },
  { name: 'mobile-statistics', who: 'athlete', device: 'mobile', path: '/dashboard/statistics' },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const tokens = { athlete: await login(CAMILLE_EMAIL), coach: await login(COACH_EMAIL) };
  const ids = await findIds(tokens.athlete);
  console.log('ids', JSON.stringify(ids)); // eslint-disable-line no-console
  const browser = await chromium.launch();
  try {
    for (const shot of SHOTS.filter((s) => !ONLY || ONLY.includes(s.name))) {
      // Scrolling to a section sometimes races the page's own layout: retry once
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await take(browser, tokens, ids, shot);
          break;
        } catch (err) {
          const message = (err as Error).message.split('\n')[0];
          console.error(`  ${shot.name} failed (attempt ${attempt}): ${message}`); // eslint-disable-line no-console
        }
      }
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err); // eslint-disable-line no-console
    process.exitCode = 1;
  });
}
