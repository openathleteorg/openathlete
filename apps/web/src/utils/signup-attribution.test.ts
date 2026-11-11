// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  captureSignupAttribution,
  forgetSignupAttribution,
  hostOf,
  readSignupAttribution,
} from './signup-attribution';

const app = (search: string) => ({ search, hostname: 'app.openathlete.org' });

describe('signup attribution', () => {
  beforeEach(() => sessionStorage.clear());

  it('keeps what a website link carries, the campaign of the landing page included', () => {
    // What the website sends after a visit that came from a Reddit campaign
    const search = new URLSearchParams({
      utm_source: 'reddit',
      utm_medium: 'cta',
      utm_campaign: 'launch',
      utm_content: 'home_hero',
      oa_ref: 'www.reddit.com',
      oa_landing: '/fr/coaches',
      oa_page: '/fr/pricing',
      oa_cta: 'home_hero',
    });

    captureSignupAttribution(app(`?${search}`), 'https://openathlete.org/');

    expect(readSignupAttribution()).toEqual({
      utmSource: 'reddit',
      utmMedium: 'cta',
      utmCampaign: 'launch',
      utmContent: 'home_hero',
      referrer: 'www.reddit.com',
      landingPage: '/fr/coaches',
      sitePage: '/fr/pricing',
      cta: 'home_hero',
    });
  });

  it('records the host of an external referrer on a direct visit, never its path', () => {
    captureSignupAttribution(
      app(''),
      'https://www.google.com/search?q=my+private+search',
    );
    expect(readSignupAttribution()).toEqual({ referrer: 'www.google.com' });
  });

  it('ignores our own sites as referrers and visits without a source', () => {
    captureSignupAttribution(app(''), 'https://openathlete.org/fr');
    captureSignupAttribution(app(''), 'https://app.openathlete.org/auth/login');
    expect(readSignupAttribution()).toBeNull();
  });

  it('keeps the first source of the visit', () => {
    captureSignupAttribution(app('?utm_source=youtube'));
    captureSignupAttribution(app('?utm_source=discord'));
    expect(readSignupAttribution()).toEqual({ utmSource: 'youtube' });

    forgetSignupAttribution();
    expect(readSignupAttribution()).toBeNull();
  });

  it('reads the host of a URL', () => {
    expect(hostOf('https://www.google.com/search?q=x')).toBe('www.google.com');
    expect(hostOf('')).toBeUndefined();
    expect(hostOf('not a url')).toBeUndefined();
  });

  it('trims values to what the API accepts', () => {
    captureSignupAttribution(app(`?utm_source=${'x'.repeat(500)}`));
    expect(readSignupAttribution()?.utmSource).toHaveLength(100);
  });
});
