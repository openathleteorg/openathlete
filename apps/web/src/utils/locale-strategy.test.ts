import { strategy } from '@/paraglide/runtime';
import { describe, expect, it } from 'vitest';

describe('locale strategy', () => {
  // The iOS app runs on capacitor://, where WKWebView keeps no cookie
  it('keeps the language in localStorage when there is no cookie', () => {
    expect(strategy).toContain('localStorage');
  });

  it('reads the cookie first, as the web and its tests set it', () => {
    expect(strategy[0]).toBe('cookie');
  });
});
