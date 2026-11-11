import {
  SignupAttribution,
  signupAttributionSchema,
} from '../types/dtos/auth/signup-attribution.dto';

/** Query parameters that carry the attribution from the website to the app */
export const ATTRIBUTION_PARAMS = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmTerm: 'utm_term',
  utmContent: 'utm_content',
  referrer: 'oa_ref',
  landingPage: 'oa_landing',
  sitePage: 'oa_page',
  cta: 'oa_cta',
} as const satisfies Record<keyof SignupAttribution, string>;

const UTM_KEYS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
] as const;

const KEYS = Object.keys(ATTRIBUTION_PARAMS) as (keyof SignupAttribution)[];

/** Longest value the API accepts for each field */
const MAX_LENGTH = Object.fromEntries(
  KEYS.map((key) => [
    key,
    signupAttributionSchema.shape[key].unwrap().maxLength ?? 100,
  ]),
) as Record<keyof SignupAttribution, number>;

function clean(
  key: keyof SignupAttribution,
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, MAX_LENGTH[key]) : undefined;
}

/** Reads query parameters: URLSearchParams in the browser */
interface QueryParams {
  get(name: string): string | null;
}

/** The attribution a URL carries, trimmed to what the API accepts. */
export function readAttribution(search: QueryParams): SignupAttribution {
  const attribution: SignupAttribution = {};
  for (const key of KEYS) {
    const value = clean(key, search.get(ATTRIBUTION_PARAMS[key]));
    if (value) attribution[key] = value;
  }
  return attribution;
}

/** Only UTM parameters: what a campaign link put on the landing page. */
export function readUtm(search: QueryParams): SignupAttribution {
  const all = readAttribution(search);
  return Object.fromEntries(
    UTM_KEYS.filter((key) => all[key]).map((key) => [key, all[key]]),
  );
}

/** The attribution as query parameters, trimmed to what the API accepts. */
export function attributionParams(
  attribution: SignupAttribution,
): [string, string][] {
  return KEYS.flatMap((key) => {
    const value = clean(key, attribution[key]);
    return value ? [[ATTRIBUTION_PARAMS[key], value] as [string, string]] : [];
  });
}

/** openathlete.org for app.openathlete.org: the site a host belongs to. */
function siteOf(host: string): string {
  return host.split('.').slice(-2).join('.');
}

/**
 * The host of the page that linked here, or undefined when there is none or
 * it is one of our own sites. Only the host: the path and query of another
 * site can hold anything, search terms included.
 */
export function externalReferrerHost(
  referrerHost: string | undefined,
  ownHost: string,
): string | undefined {
  if (!referrerHost || siteOf(referrerHost) === siteOf(ownHost)) {
    return undefined;
  }
  return clean('referrer', referrerHost);
}
