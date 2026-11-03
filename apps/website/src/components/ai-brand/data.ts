import type { ProviderSlug } from '@/components/site/providers';
import { m } from '@/paraglide/messages';

export interface AiBrand {
  slug: ProviderSlug;
  name: string;
  logo: string;
  /** White-lettered variant for dark backgrounds. */
  logoDark: string;
  /** Logo width for a 128 px height, as in PROVIDERS. */
  width: number;
  /** OpenAthlete exports planned workouts to this brand's watches. */
  watch: boolean;
  /** The brand shares sleep and HRV with OpenAthlete. */
  wellness: boolean;
  history: 'full' | 'partial' | 'none';
  isNew?: boolean;
  /** Tools the hero conversation called. */
  chatTools: string[];
  /** MCP tools behind each example prompt (aib_<slug>_p1…). */
  prompts: string[][];
  /** Pages behind the claims about the brand, checked on 2026-11-03. */
  sources: Array<{ label: string; url: string }>;
}

/**
 * What OpenAthlete does with each brand comes from apps/api providers-sync
 * (see components/connect/data.ts); what each brand offers itself was
 * checked on the web on 3 November 2026 and is cited in `sources`.
 */
export const AI_BRANDS: AiBrand[] = [
  {
    slug: 'garmin',
    name: 'Garmin',
    logo: '/providers/garmin.svg',
    logoDark: '/providers/garmin_dark.svg',
    width: 476,
    watch: true,
    wellness: true,
    history: 'partial',
    chatTools: ['get_metrics', 'get_calendar', 'get_training_load'],
    prompts: [
      ['get_metrics', 'get_training_load', 'get_calendar', 'update_session'],
      ['get_athlete_context', 'get_training_volume', 'plan_sessions'],
      ['get_capacities'],
      ['create_period', 'get_calendar', 'update_session'],
      ['update_training_zone', 'get_calendar'],
    ],
    sources: [
      {
        label:
          'Garmin newsroom, “Elevate your health and fitness goals with Garmin Connect+” (27 March 2025)',
        url: 'https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/',
      },
      {
        label: 'PyPI, mcp-garmin (community server, README)',
        url: 'https://pypi.org/project/mcp-garmin/',
      },
      {
        label:
          'Garmin forums, feature request for an MCP integration with Claude',
        url: 'https://forums.garmin.com/developer/connect-iq/f/discussion/437274/feature-request-mcp-integration-to-enable-claude-ai-access-to-garmin-connect-data-to-the-garmin-product-and-developer-teams/2045519',
      },
    ],
  },
  {
    slug: 'coros',
    name: 'COROS',
    logo: '/providers/coros.png',
    logoDark: '/providers/coros_dark.png',
    width: 527,
    watch: true,
    wellness: true,
    history: 'full',
    isNew: true,
    chatTools: ['get_training_volume', 'get_capacities', 'plan_sessions'],
    prompts: [
      ['get_capacities'],
      ['get_metrics', 'get_calendar', 'update_session'],
      ['get_calendar', 'copy_sessions', 'update_session'],
      ['create_period', 'move_sessions', 'update_session'],
      ['get_capacities', 'get_activities'],
    ],
    sources: [
      {
        label: 'COROS, MCP updates (changelog through 21 September 2026)',
        url: 'https://coros.com/stories/coros-metrics/c/mcp-testing',
      },
      {
        label: 'the5krunner, COROS MCP review (updated 3 October 2026)',
        url: 'https://the5krunner.com/2026/05/13/coros-mcp-ai-data/',
      },
    ],
  },
  {
    slug: 'suunto',
    name: 'Suunto',
    logo: '/providers/suunto.svg',
    logoDark: '/providers/suunto_dark.svg',
    width: 398,
    watch: true,
    wellness: true,
    history: 'partial',
    chatTools: ['get_activities', 'get_activity', 'get_session'],
    prompts: [
      ['get_metrics', 'get_calendar', 'move_sessions'],
      ['get_athlete_context', 'get_records', 'plan_sessions'],
      ['get_training_volume'],
      ['get_calendar', 'update_session'],
      ['get_calendar', 'get_activities'],
    ],
    sources: [
      {
        label: 'Suunto, “Why we built Suunto AI Coach” (15 October 2026)',
        url: 'https://www.suunto.com/News/why-we-built-suunto-ai-coach/',
      },
      {
        label: 'Suunto China, MCP guide (mcp.suunto.cn)',
        url: 'https://mcp.suunto.cn/mcpguide',
      },
      {
        label: 'GitHub, googlarz/suunto-mcp (community server, setup)',
        url: 'https://github.com/googlarz/suunto-mcp',
      },
    ],
  },
  {
    slug: 'polar',
    name: 'Polar',
    logo: '/providers/polar.svg',
    logoDark: '/providers/polar_dark.svg',
    width: 776,
    watch: false,
    wellness: true,
    history: 'none',
    chatTools: ['get_metrics', 'get_activity', 'get_calendar'],
    prompts: [
      ['get_metrics', 'get_training_load'],
      ['get_athlete_context', 'get_training_volume', 'plan_sessions'],
      ['get_activities', 'get_activity'],
      ['create_period', 'move_sessions', 'update_session'],
      ['get_records'],
    ],
    sources: [
      {
        label: 'Polar, AccessLink API v3 reference',
        url: 'https://www.polar.com/accesslink-api/',
      },
    ],
  },
  {
    slug: 'strava',
    name: 'Strava',
    logo: '/providers/strava.svg',
    logoDark: '/providers/strava.svg',
    width: 608,
    watch: false,
    wellness: false,
    history: 'full',
    chatTools: ['get_activities', 'get_training_volume', 'get_training_load'],
    prompts: [
      ['get_activities', 'get_capacities'],
      ['get_training_volume', 'get_athlete_context', 'plan_sessions'],
      ['get_records'],
      ['get_training_load'],
      ['get_calendar'],
    ],
    sources: [
      {
        label: 'Strava support, “Strava MCP Connector”',
        url: 'https://support.strava.com/hc/articles/46190267796237',
      },
    ],
  },
];

export const AI_BRAND_SLUGS = AI_BRANDS.map((brand) => brand.slug);

export function getAiBrand(slug: string): AiBrand | undefined {
  return AI_BRANDS.find((brand) => brand.slug === slug);
}

/** `aib_<slug>_<key>`, read in the request's locale. */
export function brandMessage(slug: ProviderSlug, key: string): string {
  const name = `aib_${slug}_${key}`;
  const fn = (m as unknown as Record<string, (() => string) | undefined>)[name];
  return fn ? fn() : name;
}
